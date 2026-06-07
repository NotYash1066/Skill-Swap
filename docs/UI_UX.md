# SkillSwap: UI/UX Specification

This document provides a comprehensive overview of the User Interface (UI) and User Experience (UX) of the SkillSwap platform, detailing every screen, flow, action, and animation within the application.

---

## 1. Core User Flows

### 1.1 Authentication & Onboarding
1.  **Landing/Login**: User arrives at the login screen.
2.  **Action**: User enters credentials or clicks "Sign up".
3.  **Validation**: Frontend validates format; backend validates credentials.
4.  **Redirection**: Successful login triggers a full-page reload to ensure fresh authentication state, directing the user to the Dashboard.

### 1.2 Skill Discovery & Matching
1.  **Discovery**: User navigates to the "Matches" page.
2.  **Search/Filter**: User applies filters (Location, Rating, Availability) via the Advanced Search component.
3.  **Connection**: User clicks "Connect" on a potential match's card.
4.  **Request**: User fills out a connection message in a modal and sends the request.
5.  **Response**: Recipient receives a notification and can "Accept" or "Decline" the request in their "Requests" tab.

### 1.3 Communication & Collaboration
1.  **Chat**: Once a match is accepted, users can exchange instant messages in the Chat page.
2.  **Video Call**: User initiates a call from the chat header. A global overlay manages the call state across the app.
3.  **Whiteboard**: During a session, users can open a collaborative whiteboard for real-time visual demonstration and synchronization.

---

## 2. Screen-by-Screen Breakdown

### 2.1 Login Screen (`Login.jsx`)
*   **Content**: Welcome header, email input, password input, "Sign In" button, "Sign up here" link.
*   **Actions**:
    *   `onSubmit`: Authenticates user, stores JWT in localStorage, redirects to `/dashboard`.
    *   `onChange`: Updates form state.
*   **UX Elements**: Inline error messages for invalid credentials, loading state on the submit button.

### 2.2 Registration Screen (`Register.jsx`)
*   **Content**: Account creation header, username/email/password inputs, "Create Account" button, login link.
*   **Actions**:
    *   `onSubmit`: Registers user, automatically logs them in upon success, redirects to `/dashboard`.
*   **UX Elements**: Multi-field validation, responsive card layout.

### 2.3 Dashboard (`Dashboard.jsx`)
*   **Content**: Global navigation (Dashboard, Matches, Chat, Profile), User Greeting, Notification Bell, Theme Toggle, Logout button.
*   **Main Sections**:
    *   **Skill Selectors**: Two "SkillSelector" components for managing "Skills I Offer" and "Skills I Want to Learn".
    *   **Profile Summary**: Displays username, email, bio (editable inline), location, and availability.
*   **Actions**:
    *   `handleLogout`: Clears local storage and redirects to login.
    *   `updateBio`: Inline editing of the user's biography.
    *   `handleSkillsChange`: Real-time updates to skill tags.
*   **UX Elements**: Success/Error alerts with automatic dismissal after 5 seconds.

### 2.4 Matches Discovery (`Matches.jsx`)
*   **Content**: Page header, Hero section with description, Advanced Search bar.
*   **Tabs**: "Discover", "Requests" (Received), "Sent".
*   **Match Cards**: Display username, rating (FiStar), compatibility score, location (FiMapPin), and skill tags.
*   **Actions**:
    *   `setActiveTab`: Switches between discovery and request management.
    *   `sendMatchRequest`: Opens connection modal.
    *   `respondToMatch`: Accept/Decline logic for received requests.
*   **UX Elements**: Skeleton loading/Spinners, modal overlays for sending requests, clickable names to view full user profiles.

### 2.5 Chat Interface (`Chat.jsx`)
*   **Content**: 
    *   **Sidebar**: List of active chat rooms with participant avatars, last message preview, and activity timestamp.
    *   **Main Window**: Chat header with participant info, Video Call button, Whiteboard button.
    *   **Message Feed**: Bubble-style messages (own vs. other), typing indicators.
    *   **Input**: Text area with "Send" button.
*   **Actions**:
    *   `sendMessage`: Persists message and broadcasts via Socket.io.
    *   `handleTyping`: Triggers "is typing" status to the peer.
    *   `startVideoCall`: Dispatches global event to initiate WebRTC session.
    *   `openWhiteboard`: Toggles the collaborative whiteboard overlay.
*   **UX Elements**: Smooth auto-scroll to latest message, real-time "User is typing..." indicator.

### 2.6 Video Call Overlay (`VideoCall.jsx`)
*   **Content**: 
    *   **States**: Calling, Connecting, Connected, Rejected, Error.
    *   **Controls**: Mute/Unmute, Camera On/Off, Screen Share, End Call.
    *   **Views**: Local preview (PiP), Remote participants grid.
*   **Actions**:
    *   `acceptCall`/`rejectCall`: Handles incoming invitation.
    *   `toggleScreenShare`: Switches WebRTC track to display media.
    *   `endCall`: Tears down peer connection and signaling.
*   **UX Elements**: Full-screen modal overlay, pulsating "Calling" animation, labels for local/remote participants.

### 2.7 Collaborative Whiteboard (`Whiteboard.jsx`)
*   **Content**: Toolbar (Pen, Eraser, Color Picker, Size Slider, Clear, Close), Drawing Canvas.
*   **Actions**:
    *   `broadcastUpdate`: Throttled synchronization of canvas JSON state via Socket.io.
    *   `clearBoard`: Resets canvas for both participants.
*   **UX Elements**: Overlay mode, responsive canvas resizing, immediate local feedback with background sync.

---

## 3. UI Components & Interactions

### 3.1 Common Elements (`common/index.jsx`)
*   **Button**: Interactive states (hover, active, disabled). Includes variants: primary, secondary, accent, success, error.
*   **Card**: Elevated container with hover transition (shadow intensification).
*   **Spinner**: Animated CSS border-spin for loading states.
*   **Input**: Standardized padding and focus rings.

### 3.2 Navigation & Global State
*   **NotificationBell**: Pulsating dot when new notifications arrive.
*   **ThemeToggle**: Switches between Light and Dark modes with a global CSS variable transition.
*   **AdvancedSearch**: Collapsible or hero-integrated search parameters.

---

## 4. Animations & Transitions (CSS-Based)

*   **Global Transitions**: 
    *   `transition: all var(--transition-fast)` on buttons and inputs for smooth hover/focus effects.
    *   `transition: background-color/color` on body for seamless theme switching.
*   **Component Specific**:
    *   **Spinners**: `spin` keyframes (linear infinite) for loading.
    *   **Cards**: `translateY(-1px)` and `box-shadow` changes on hover.
    *   **Video Call**: 
        *   "Pulsating" loading dots during the "Calling" state.
        *   Fade-in animations for modal overlays.
    *   **Alerts**: Slide-in/Fade-out behavior (managed via JS timeouts).
*   **Typing Indicators**: Subtle opacity animation or "dot-dance" to signify peer activity.
*   **Whiteboard**: Throttled (500ms) JSON sync to prevent "jitter" during remote rendering.

---

## 5. Mobile & Responsive Design
*   **Breakpoints**: Optimized for 640px and below.
*   **Adjustments**: 
    *   Grid layouts (Dashboard/Matches) stack vertically on small screens.
    *   Padding and spacing (`--space-xl`) reduce for mobile.
    *   Typography (`--font-size-4xl`) scales down to fit viewport.
    *   Chat sidebar becomes collapsible or takes priority in mobile view.
