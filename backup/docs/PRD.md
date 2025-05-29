# Product Requirements Document: WhisperChain (Android)

**Version:** 1.0
**Date:** October 26, 2023
**Author:** AI Product Manager

## 1. Introduction
WhisperChain is a mobile application designed to provide a safe, anonymous, and artistic space for users to share their thoughts, feelings, and dreams. Users, or "Whisperers," can post short text entries ("Whispers"), optionally categorize them by theme, and see their raw thoughts transformed into more poetic or artistic expressions. The platform encourages empathy and connection through chained responses, allowing users to build upon each other's Whispers. Gamification elements and community insights further enhance user engagement.

## 2. Goals
*   **Primary Goal:** To create a supportive and anonymous community where users feel safe to express themselves freely.
*   **Secondary Goal:** To transform user thoughts into shareable, artistic expressions, fostering creativity and deeper reflection.
*   **Tertiary Goal:** To build an engaged user base through interactive features like chains, likes, and achievements.
*   **Business Goal (Future):** Establish a platform that could potentially monetize through premium features (e.g., advanced AI art styles, exclusive themes) once a strong user base is established.

## 3. Target Audience
*   Individuals seeking an outlet for anonymous self-expression.
*   People who enjoy creative writing, poetry, or artistic interpretations of thoughts.
*   Users looking for a non-judgmental community to share feelings of loneliness, fear, hope, dreams, etc.
*   Young adults and adults (16+) comfortable with digital platforms.

## 4. Overall Design Philosophy & Color Scheme
*   **Elegance & Modernity:** The app should feel premium, intuitive, and visually appealing. Dark mode first.
*   **Empathy & Safety:** UI/UX should reinforce the sense of a safe, supportive space.
*   **Color Scheme (Dark Theme Dominant):**
    *   **Primary Background:** Deep Indigo/Purple (e.g., ``#1A1033`` - similar to screenshots)
    *   **Card/Modal Backgrounds:** Slightly lighter shade of primary (e.g., ``#2B1F4C`` or ``#20133D``)
    *   **Primary Accent (Buttons, Highlights, Active Tabs):** Vibrant Purple/Blue (e.g., ``#6A3EFF`` or ``#7F5BFF``)
    *   **Secondary Accent (Icons, subtle highlights):** A softer lavender or pink (e.g., ``#B39DDB`` or ``#E91E63`` for specific themes like "Love")
    *   **Text (Primary):** Off-white (e.g., ``#F5F5F5``)
    *   **Text (Secondary/Subtle):** Light Gray (e.g., ``#B0B0B0``)
    *   **Theme Tag Colors:**
        *   Love: Pink (e.g., ``#EC407A``)
        *   Fear: Darker Red/Maroon (e.g., ``#7E2A33``)
        *   Dreams: Light Blue/Purple (e.g., ``#7C5CFF``)
        *   Nature: Green (e.g., ``#4CAF50``)
        *   Abstract: Teal/Cyan (e.g., ``#00BCD4``)
        *   Joy: Orange/Yellow (e.g., ``#FF9800``)
        *   Hope: Light Green/Aqua (e.g., ``#26A69A``)
        *   Sadness: Muted Blue (e.g., ``#5C6BC0``)
    *   **Error/Alert:** A distinct red/orange.
*   **Typography:**
    *   **Headings:** A clean, modern sans-serif (e.g., Montserrat, Inter, Circular Std).
    *   **Body Text:** Highly readable sans-serif (e.g., Inter, Roboto, Open Sans).
*   **Iconography:** Consistent, sleek, and modern (e.g., Feather Icons, Material Symbols - outlined or rounded variants).

## 5. Key Features & Screens

### 5.1. Onboarding & Authentication (Screen 4 & 7)
#### 5.1.1. Splash Screen (Screen 7):
*   Displays app logo (animated "W" or radar-like animation).
*   Tagline: "Your thoughts, transformed into art."
#### 5.1.2. Sign Up/Login Screen (Screen 4):
*   App logo and tagline.
*   **Username (Optional):** Text input field. If provided at sign-up, this creates a non-anonymous account. Users can choose to remain anonymous initially and set a username later via profile settings.
*   **Email:** Text input field with validation (required for non-anonymous accounts).
*   **Password:** Text input field with visibility toggle and strength indicator (required for non-anonymous accounts).
*   **"Create Account" Button.**
*   Link: "Already have an account? Sign in."
*   **Social Logins:** Buttons for Google, X (Twitter), Facebook (creates a non-anonymous account).
*   **"Continue as Anonymous" Button:** Allows usage without full account creation. Anonymous users will have limitations (e.g., cannot recover data if app is uninstalled, certain achievements might be locked). Anonymous profiles will have a default generated name (e.g., "Dreamer79") which can be changed in profile settings. An anonymous user can later choose to associate an email and password to convert to a non-anonymous account, or set a unique username if available.

### 5.2. Main Navigation (Bottom Navigation Bar - Screens 6, 8, 9)
*   Consists of 4 tabs: Home, Write, Themes, Profile.
*   Active tab should be clearly indicated (e.g., with primary accent color).

### 5.3. Home Screen (Global Whispers - Screen 3)
*   **Purpose:** Displays a feed of recent or trending Whispers from the community.
*   **Header:**
    *   App Logo ("W WhisperChain").
    *   Search Icon: Tapping opens a search interface (see 5.10).
    *   Menu Icon (Hamburger): Opens a drawer for settings, about, help, etc. (or these can be moved to Profile).
*   **Sorting/Filtering:** Dropdown menu (default: "Trending"). Options: Trending, Newest, Most Liked, Most Chained.
    *   **Trending Algorithm:** Defined by a combination of factors including the number of likes and chain responses within a recent time window (e.g., last 24-48 hours), and the velocity of these interactions. Recency of the original Whisper also plays a role.
*   **Whisper Card Layout:**
    *   **Theme Tag:** Small, colored pill-shaped tag at the top (e.g., "Loneliness," "Fear").
    *   **AI-Transformed Text:** Prominently displayed, larger font.
    *   **Original Thought:** Smaller, italicized text below the transformed text (e.g., *"I feel so alone in this crowded room"*).
    *   **Interaction Bar:**
        *   Heart Icon & Like Count.
        *   Chat Bubble Icon & Comment/Chain Count.
        *   Globe/Target Icon & "Guess" action.
    *   Tapping a card navigates to the "Whisper Chain View" (Screen 5).

### 5.4. Write Screen (New Whisper - Screen 1 / Screen 9)
*   **Purpose:** Allows users to create and share new Whispers.
*   **Header:** Back arrow, "New Whisper" title.
*   **Input Field:** Large text area with placeholder "What's on your mind?" or "Share your thoughts, feelings, or dreams...". Max character limit (e.g., 500 characters for the original thought).
*   **Theme Selection (Optional):**
    *   Label: "Optional: Select a Theme"
    *   **Chip-based selection (preferred, as in Screen 1):** Love, Fear, Dreams, Nature, Abstract.
    *   **"+ Custom" Chip:** Allows user to type a custom theme (max 2-3 words).
        *   **Moderation Workflow:** Custom themes are submitted to a moderation queue. Admins review themes for appropriateness and relevance. Approved themes become globally selectable and searchable. Rejected themes are not added, and the user may (or may not, TBD) be notified.
    *   (Alternative from Screen 9: Dropdown "Choose a theme for your whisper" - use chips for better UX).
    *   **"Whisper It" Button:** Submits the Whisper.
    *   **AI Transformation:** Upon submission, the user's raw thought is processed by an AI/NLP model to generate the more poetic/artistic version. A loading indicator should be shown.
    *   After successful submission and transformation, the user is redirected to their newly created Whisper within its "Whisper Chain View".

### 5.5. Themes Screen (Explore Themes - Screen 8)
*   **Purpose:** Allows users to discover Whispers based on specific themes.
*   **Header:** "Explore Themes" title. Subtitle: "Discover whispers by emotion and feeling."
*   **Theme Grid:** Large, colorful cards for popular predefined themes (Love, Dreams, Fear, Joy, Hope, Sadness).
    *   Each card displays: Icon, Theme Name, Whisper Count (e.g., "1234 whispers").
    *   Tapping a theme card navigates to a filtered feed showing only Whispers with that theme.
*   **Trending Now Section:**
    *   List of trending hashtags/custom themes (e.g., #LateNightThoughts, #MidnightConfessions) with their whisper counts.
    *   Tapping a trending item navigates to a filtered feed.

### 5.6. Profile Screen (Screen 6)
*   **Purpose:** User's personal space, achievements, and app settings.
*   **Header:** User's display name (e.g., "Dreamer79"). Status (e.g., "Anonymous Whisperer" or "Verified Whisperer" if email linked).
*   **Stats Section:**
    *   "Whispers Shared" count.
    *   "Chains Started" count.
    *   "Achievements" count (or progress to next achievement).
*   **Achievements List:**
    *   Scrollable list of earnable/earned achievements (e.g., First Whisper, 10 Whispers Shared, Guessed Right 5 Times, Thread Starter, Community Helper).
    *   Each item shows: Star icon, Achievement Name. Tapping could show criteria or date earned.
*   **Navigation Links:**
    *   "My Whispers": Takes user to a feed of their own Whispers.
    *   "My Chains": Takes user to a feed of chains they've participated in or started.
    *   "Settings": (See 5.9).
    *   "Sign Out" Button.

### 5.7. Whisper Chain View (Screen 5)
*   **Purpose:** Displays an original Whisper and the chain of responses/interpretations.
*   **Header:** Back arrow, "Whisper Chain" (or the actual theme name, e.g., "Loneliness").
*   **Original Whisper Card:**
    *   User Avatar (or default anonymous avatar).
    *   Username (e.g., "Sophia").
    *   Date/Time of Whisper.
    *   Theme Tag (e.g., "Loneliness").
    *   AI-transformed text of the original Whisper.
    *   (Optional: Original thought if different from AI text).
*   **Chained Responses:**
    *   Displayed chronologically below the original Whisper.
    *   Each response card: Avatar, Username, Date/Time, AI-transformed text of their contribution.
*   **"Whisper your thoughts..." Input Field:** At the bottom, allows users to add their own interpretation/continuation to the chain.
*   **Send Button:** Submits the new chained Whisper. (AI transformation applies here too).

### 5.8. Guess the Whisperer (Modal - Screen 2)
*   **Purpose:** An optional, gamified way to gather anonymous, aggregated demographic data for community insights. *This data is NOT linked to individual users publicly.*
*   **Trigger:** Tapping the "Guess" icon on a Whisper card in the Home feed.
*   **Modal Dialog:**
    *   Close (X) button.
    *   Title: "Guess the Whisperer."
    *   Subtitle: "Help us understand our community better! Your anonymous guesses about the whisperer's age, country, and gender (optional) contribute to valuable insights."
    *   **Age Range Selection:** Buttons/Chips (13-18, 19-25, 26-40, 41+).
    *   **Country Selection:** Dropdown menu "Select Country."
    *   **Gender (Optional) Selection:** Buttons/Chips (Male, Female, Other).
    *   **"Reveal Stats" Button:**
        *   After submitting guesses, the user sees *aggregated, anonymized* statistics for *that specific Whisper* (e.g., "60% of guessers thought the Whisperer was 19-25," "Most common guessed country: USA").
        *   *It does NOT reveal the actual Whisperer's demographics.*
        *   Correct guesses (if the original whisperer *optionally* provided their own data non-publicly for this feature) could contribute to the "Guessed Right X Times" achievement.
            *   **User Data Provision:** Users can optionally provide their demographic data (age range, country, gender) within their Profile Settings under a "Community Insights" section. It will be explicitly stated that this data is *never made public or linked to their profile*, is used *only for aggregated, anonymized statistics* for the "Guess the Whisperer" feature, and can be updated or removed at any time. This is an opt-in feature.

### 5.9. Settings (Accessible from Profile or Hamburger Menu)
*   Account Management: Change username (if not anonymous or for anonymous ID), change email, change password, delete account.
    *   **Data Deletion:** When a user deletes their account:
        *   **Non-Anonymous Users:** All personally identifiable information (email, username, password hash) is hard-deleted. Their Whispers and chain contributions will be anonymized (attributed to "A Former Whisperer" or similar) but the content itself may be retained to preserve chain integrity, unless a hard delete of all content is specifically requested and technically feasible.
        *   **Anonymous Users:** Since no PII is stored, "deleting" an anonymous account primarily means clearing locally stored identifiers. If the anonymous user created Whispers, these will remain as they are already anonymous.
        *   Consider GDPR/CCPA compliance for data handling and deletion requests.
*   Notification Preferences: Toggle notifications for new chain responses, achievements, etc.
*   Privacy Settings: Manage data sharing preferences (e.g., opting out of "Guess the Whisperer" data contribution for their own whispers).
*   Appearance: Light/Dark mode toggle (if light mode is implemented).
*   About: App version, links to ToS, Privacy Policy.
*   Help/Support: FAQ, contact support.

### 5.10. Search Functionality
*   Accessible from Home screen header.
*   Allows users to search for Whispers based on keywords found in the AI-transformed text or original thought.
*   Search results displayed in a list similar to the Home feed.

### 5.11. AI Transformation Logic
*   When a user submits a "Whisper" or a "Chain Response":
    1.  The raw text is sent to a backend NLP/LLM service.
    2.  The service processes the text to:
        *   Identify sentiment/keywords to suggest themes (if not already chosen). If no theme is selected by the user, the AI can suggest 1-3 relevant themes as chips/tags that the user can tap to select before final submission, or the AI can automatically assign the most relevant theme.
        *   Rewrite/rephrase the text into a more poetic, metaphorical, or artistic style, while retaining the core meaning.
        *   The length of the transformed text should be comparable or slightly longer than the original.
    3.  The original thought and the transformed text are stored.
*   This feature is central to the app's unique selling proposition.

## 6. Non-Functional Requirements
*   **Security:**
    *   Secure authentication (OAuth for social logins, hashed passwords).
    *   All data in transit encrypted (HTTPS).
    *   Data at rest encrypted, especially PII (if any collected beyond email).
    *   Robust content moderation tools for admins, including:
        *   A dashboard to review flagged content (user reports, AI-flagged).
        *   Keyword-based alerts for potentially harmful content.
        *   Tools to view user history (anonymized if applicable) for repeat offenses.
        *   Ability to soft/hard delete specific Whispers or chain responses.
        *   Ability to temporarily suspend or permanently ban users (identified by internal ID for anonymous users, or account for registered users).
    *   Anonymity must be preserved; no accidental deanonymization.
*   **Performance:**
    *   App launch time < 3 seconds.
    *   Smooth scrolling and animations (target 60fps).
    *   Quick API response times for Whisper loading and submission (< 1-2 seconds, AI processing might take slightly longer but should have clear loading states).
*   **Scalability:**
    *   Backend designed to handle a growing number of users and Whispers.
    *   Efficient database queries.
*   **Usability:**
    *   Intuitive navigation and clear calls to action.
    *   Consistent UI/UX across the app.
    *   Minimalistic and uncluttered interface.
*   **Accessibility:**
    *   Adherence to WCAG 2.1 AA guidelines where feasible (e.g., sufficient color contrast, support for screen readers, touch target sizes).
*   **Reliability:**
    *   Minimal crashes (target >99.9% crash-free sessions).
    *   Data persistence: User's Whispers, achievements, etc., should be reliably saved and synced.

## 7. Technical Stack (Latest Android)
*   **Programming Language:** `Kotlin` (100%).
*   **Architecture:** MVVM (Model-View-ViewModel) or MVI (Model-View-Intent) with Clean Architecture principles.
*   **UI Toolkit:** Jetpack Compose for all UI elements.
*   **Asynchronous Operations:** Kotlin Coroutines & Flow.
*   **Dependency Injection:** Hilt (recommended) or Koin.
*   **Networking:** Retrofit for API calls, OkHttp as the HTTP client, Moshi/KotlinX Serialization for JSON parsing.
*   **Local Database:** Room Persistence Library for caching and offline support.
*   **Navigation:** Jetpack Navigation Compose.
*   **Image Loading:** Coil or Glide (ensure Compose compatibility).
*   **Backend:**
    *   **Recommended:** Firebase (Authentication, Firestore/Realtime Database, Cloud Functions for AI integration and business logic, Cloud Storage for any user-uploaded images if custom themes allow image backgrounds in the future).
    *   **Alternative:** Custom backend (e.g., Node.js/Express, Python/Django/Flask, Ktor) with a managed database (e.g., PostgreSQL, MongoDB Atlas).
*   **AI/NLP Service:**
    *   Google Cloud Vertex AI (Gemini API)
    *   OpenAI API (GPT-3.5-turbo, GPT-4)
    *   Integration via Cloud Functions or dedicated backend service.
*   **Push Notifications:**
    *   Firebase Cloud Messaging (FCM) if using Firebase backend.
    *   Alternatives for custom backend: OneSignal, or custom implementation using APNS/GCM directly.
*   **Analytics:** Firebase Analytics, Google Analytics for Firebase.
*   **Crash Reporting:** Firebase Crashlytics.
*   **CI/CD:** GitHub Actions, GitLab CI, or Bitrise.

## 8. Monetization (Future Consideration - Not for V1)
*   Premium Themes: Visually distinct themes or AI art styles.
*   Ad-Free Version: Subscription to remove ads (if ads are introduced).
*   Increased AI Capabilities: e.g., longer Whisper transformations, advanced poetic styles.

## 9. Success Metrics (V1)
*   Daily Active Users (DAU) / Monthly Active Users (MAU).
*   User Retention Rate (Day 1, Day 7, Day 30).
*   Number of Whispers created per user.
*   Number of Chain responses per Whisper.
*   Average session duration.
*   Theme engagement (most popular themes).
*   Achievement unlock rate.
*   "Guess the Whisperer" participation rate.
*   App Store Rating and Reviews.

## 10. Future Considerations / V2+ Features
*   **AI-Generated Visuals:** Generate abstract art/images based on the Whisper's theme and content to accompany the text.
*   **Voice Whispers:** Allow users to record short audio snippets, which are then transcribed and transformed.
*   **Private Whispers/Journals:** Allow users to create Whispers visible only to themselves.
*   **Following Users/Themes:** Ability to follow specific (anonymous) users whose Whispers resonate, or specific themes.
*   **Enhanced "Guess the Whisperer":** More sophisticated community insights, perhaps trend reports.
*   **Moderation System:** Community-driven flagging system.
*   **Direct Messaging (Careful Consideration):** Could compromise anonymity if not handled very carefully; potentially opt-in and heavily moderated.
*   **Localized Content & Themes.**