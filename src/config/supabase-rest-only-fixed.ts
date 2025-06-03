// Fixed REST-only Supabase client that properly handles chaining
import { Environment } from './environment';

// Validate environment variables on import
Environment.validateRequiredVars();

const supabaseUrl = Environment.supabaseUrl;
const supabaseKey = Environment.supabaseAnonKey;

class RestOnlySupabaseClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(url: string, key: string) {
    this.baseUrl = `${url}/rest/v1`;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  }

  from(table: string) {
    return new RestOnlyQueryBuilder(this.baseUrl, this.headers, table);
  }

  async rpc(functionName: string, params: any = {}) {
    const url = `${this.baseUrl.replace('/rest/v1', '')}/rest/v1/rpc/${functionName}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        let errorBody: any;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        
        return {
          data: null,
          error: {
            message: errorBody.message || `HTTP error! status: ${response.status}`,
            status: response.status,
            details: errorBody,
          },
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 0,
        },
      };
    }
  }
}

class RestOnlyQueryBuilder {
  private baseUrl: string;
  private headers: Record<string, string>;
  private table: string;
  private selectQuery: string = '*';
  private filters: string[] = [];
  private orderByClause: string = '';
  private limitValue: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private _method: string = 'GET';
  private _updateData: any = null;

  constructor(baseUrl: string, headers: Record<string, string>, table: string) {
    this.baseUrl = baseUrl;
    this.headers = { ...headers }; // Clone headers to avoid mutation
    this.table = table;
  }

  select(query: string = '*') {
    this.selectQuery = query;
    return this;
  }

  eq(column: string, value: any) {
    if (value === undefined || value === null) {
      console.warn(`Warning: eq() called with ${value} for column ${column}`);
      // Skip adding this filter
      return this;
    }
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(`${column}=neq.${encodeURIComponent(value)}`);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push(`${column}=gt.${encodeURIComponent(value)}`);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push(`${column}=gte.${encodeURIComponent(value)}`);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push(`${column}=lt.${encodeURIComponent(value)}`);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push(`${column}=lte.${encodeURIComponent(value)}`);
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push(`${column}=like.${encodeURIComponent(pattern)}`);
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push(`${column}=ilike.${encodeURIComponent(pattern)}`);
    return this;
  }

  is(column: string, value: any) {
    this.filters.push(`${column}=is.${value}`);
    return this;
  }

  in(column: string, values: any[]) {
    if (!values || values.length === 0) {
      return this;
    }
    this.filters.push(`${column}=in.(${values.map(v => encodeURIComponent(v)).join(',')})`);
    return this;
  }

  contains(column: string, value: any) {
    this.filters.push(`${column}=cs.${encodeURIComponent(JSON.stringify(value))}`);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    const direction = options.ascending === false ? 'desc' : 'asc';
    this.orderByClause = `&order=${column}.${direction}`;
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  single() {
    this.isSingle = true;
    this.isMaybeSingle = false;
    this.limitValue = 1;
    return this;
  }

  maybeSingle() {
    // Like single() but doesn't throw error if no rows found
    this.isSingle = true;
    this.isMaybeSingle = true;
    this.limitValue = 1;
    return this;
  }

  private buildUrl(): string {
    let url = `${this.baseUrl}/${this.table}?select=${this.selectQuery}`;
    
    if (this.filters.length > 0) {
      url += `&${this.filters.join('&')}`;
    }
    
    if (this.orderByClause) {
      url += this.orderByClause;
    }
    
    if (this.limitValue !== null) {
      url += `&limit=${this.limitValue}`;
    }
    
    console.log('Built URL:', url);
    return url;
  }

  async execute(): Promise<{ data: any; error: any }> {
    // Handle DELETE method
    if (this._method === 'DELETE') {
      return this.executeDelete();
    }
    
    // Handle PATCH method (update)
    if (this._method === 'PATCH') {
      return this.executeUpdate();
    }
    
    const url = this.buildUrl();
    
    console.log('Fetching from URL:', url);
    
    try {
      const headers = { ...this.headers };
      if (this.isSingle && !this.isMaybeSingle) {
        headers['Accept'] = 'application/vnd.pgrst.object+json';
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        let errorBody: any;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        
        console.error('API Error:', response.status, errorBody);
        console.error('Failed URL:', url);
        
        return {
          data: null,
          error: {
            message: errorBody.message || `HTTP error! status: ${response.status}`,
            status: response.status,
            details: errorBody,
          },
        };
      }

      const data = await response.json();
      
      // Handle single() - return object instead of array
      if (this.isSingle) {
        if (Array.isArray(data) && data.length > 0) {
          return { data: data[0], error: null };
        } else if (Array.isArray(data) && data.length === 0) {
          return { data: null, error: null };
        }
        return { data, error: null };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 0,
        },
      };
    }
  }

  // Make it thenable for async/await
  then(resolve: any, reject?: any) {
    return this.execute().then(resolve, reject);
  }

  async insert(values: any | any[]) {
    const url = `${this.baseUrl}/${this.table}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        let errorBody: any;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        
        return {
          data: null,
          error: {
            message: errorBody.message || `HTTP error! status: ${response.status}`,
            status: response.status,
            details: errorBody,
          },
        };
      }

      const data = await response.json();
      
      // If single value was inserted, return single object
      if (!Array.isArray(values) && Array.isArray(data) && data.length === 1) {
        return { data: data[0], error: null };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 0,
        },
      };
    }
  }

  update(values: any) {
    this._updateData = values;
    this._method = 'PATCH';
    return this;
  }

  private async executeUpdate() {
    const url = this.buildUrl();
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(this._updateData),
      });

      if (!response.ok) {
        let errorBody: any;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        
        return {
          data: null,
          error: {
            message: errorBody.message || `HTTP error! status: ${response.status}`,
            status: response.status,
            details: errorBody,
          },
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 0,
        },
      };
    }
  }

  delete() {
    // Set the method to DELETE for later execution
    this._method = 'DELETE';
    // Return this to allow chaining
    return this;
  }

  private async executeDelete() {
    const url = this.buildUrl();
    
    console.log('DELETE request to URL:', url);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.headers,
      });

      if (!response.ok) {
        let errorBody: any;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        
        return {
          data: null,
          error: {
            message: errorBody.message || `HTTP error! status: ${response.status}`,
            status: response.status,
            details: errorBody,
          },
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 0,
        },
      };
    }
  }
}

// Export a REST-only client that mimics Supabase's interface
export const supabase = new RestOnlySupabaseClient(supabaseUrl, supabaseKey) as any;