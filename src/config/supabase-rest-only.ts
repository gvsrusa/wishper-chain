// REST-only Supabase client that completely avoids WebSocket imports
import { SupabaseClient } from '@supabase/supabase-js';
import { Environment } from './environment';

// Validate environment variables on import
Environment.validateRequiredVars();

// Create a minimal Supabase client configuration that only uses REST
const supabaseUrl = Environment.supabaseUrl;
const supabaseKey = Environment.supabaseAnonKey;

// Custom fetch wrapper for Supabase REST API
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

  rpc(functionName: string, params: any = {}) {
    return new RestOnlyRpcBuilder(this.baseUrl, this.headers, functionName, params);
  }
}

class RestOnlyQueryBuilder {
  private baseUrl: string;
  private headers: Record<string, string>;
  private table: string;
  private selectQuery: string = '*';
  private whereConditions: string[] = [];
  private orderByClause: string = '';
  private limitClause: string = '';

  constructor(baseUrl: string, headers: Record<string, string>, table: string) {
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.table = table;
  }

  select(query: string = '*') {
    this.selectQuery = query;
    return this;
  }

  eq(column: string, value: any) {
    this.whereConditions.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  in(column: string, values: any[]) {
    this.whereConditions.push(`${column}=in.(${values.map(v => encodeURIComponent(v)).join(',')})`);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    const direction = options.ascending === false ? 'desc' : 'asc';
    this.orderByClause = `&order=${column}.${direction}`;
    return this;
  }

  limit(count: number) {
    this.limitClause = `&limit=${count}`;
    return this;
  }

  single() {
    this.limitClause = `&limit=1`;
    return this;
  }

  async execute() {
    const whereClause = this.whereConditions.length > 0 ? `&${this.whereConditions.join('&')}` : '';
    const url = `${this.baseUrl}/${this.table}?select=${this.selectQuery}${whereClause}${this.orderByClause}${this.limitClause}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  }

  // Alias for execute to match Supabase API
  then(resolve: any, reject?: any) {
    return this.execute().then(resolve, reject);
  }

  async insert(values: any) {
    const response = await fetch(`${this.baseUrl}/${this.table}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  }

  async update(values: any) {
    const whereClause = this.whereConditions.length > 0 ? `?${this.whereConditions.join('&')}` : '';
    const response = await fetch(`${this.baseUrl}/${this.table}${whereClause}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  }

  async delete() {
    const whereClause = this.whereConditions.length > 0 ? `?${this.whereConditions.join('&')}` : '';
    const response = await fetch(`${this.baseUrl}/${this.table}${whereClause}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  }
}

class RestOnlyRpcBuilder {
  private baseUrl: string;
  private headers: Record<string, string>;
  private functionName: string;
  private params: any;

  constructor(baseUrl: string, headers: Record<string, string>, functionName: string, params: any) {
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.functionName = functionName;
    this.params = params;
  }

  async execute() {
    const response = await fetch(`${this.baseUrl}/rpc/${this.functionName}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(this.params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  }

  // Alias for execute to match Supabase API
  then(resolve: any, reject?: any) {
    return this.execute().then(resolve, reject);
  }
}

// Export a REST-only client that mimics Supabase's interface
export const supabase = new RestOnlySupabaseClient(supabaseUrl, supabaseKey) as any;