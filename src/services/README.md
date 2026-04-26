# Data Service Layer Documentation

This directory contains the data service layer that allows the application to work with either localStorage mock data or real APIs.

## Architecture

### 1. `dataService.js` - localStorage Mock Data Service
- Provides mock data and CRUD operations using localStorage
- Automatically initializes with sample data on first load
- All data persists between browser sessions
- Perfect for development, testing, and demos

### 2. `apiService.js` - API Abstraction Layer
- Unified interface for both mock and real API calls
- Toggle between localStorage and real APIs with a single flag
- Maintains the same interface regardless of backend
- Handles authentication, error handling, and data transformation

### 3. `useApi.js` - React Hook
- Custom hook that provides easy access to all API operations
- Automatically handles authentication requirements
- Provides organized API access by feature area
- Includes error handling and loading states

## Usage

### Switching Between Mock and Real APIs

In `apiService.js`, change this line:

```javascript
const USE_REAL_API = false; // Toggle this to switch between mock and real APIs
```

- `false`: Uses localStorage mock data (default)
- `true`: Uses real backend APIs

### Using the API in Components

```javascript
import useApi from '../hooks/useApi';

function MyComponent() {
  const api = useApi();

  // Get current user
  const user = api.currentUser;

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const tasks = await api.tasks.getTasks();
      console.log('Tasks:', tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  // Create a new task
  const createTask = async (taskData) => {
    try {
      const newTask = await api.tasks.createTask(taskData);
      console.log('Created task:', newTask);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    // Your component JSX
  );
}
```

## Available API Endpoints

### Authentication
- `api.auth.login(email, password)`
- `api.auth.register(email, password, name)`
- `api.auth.getCurrentUser()`
- `api.auth.logout()`
- `api.auth.processOAuthCode(code)`

### Tasks
- `api.tasks.getTasks()`
- `api.tasks.createTask(taskData)`
- `api.tasks.updateTask(taskId, updates)`
- `api.tasks.deleteTask(taskId)`
- `api.tasks.updateTaskProgress(taskId, progress)`

### Notes
- `api.notes.getNotes()`
- `api.notes.createNote(noteData)`
- `api.notes.updateNote(noteId, updates)`
- `api.notes.deleteNote(noteId)`
- `api.notes.getFolders()`

### Library
- `api.library.getItems()`
- `api.library.getItemsByType(itemType)`
- `api.library.createItem(itemData)`

### Competitions
- `api.competitions.getCompetitions()`
- `api.competitions.joinCompetition(competitionId)`
- `api.competitions.submitEntry(competitionId, submissionData)`
- `api.competitions.getHistory()`

### Shop
- `api.shop.getItems()`
- `api.shop.purchaseItem(itemId)`
- `api.shop.getPurchaseHistory()`

### Community
- `api.community.getServers()`
- `api.community.getChannels(serverId)`
- `api.community.getMessages(channelId)`
- `api.community.sendMessage(channelId, content)`
- `api.community.joinServer(serverId)`

### Practice (SAT/ACT)
- `api.practice.getStats()`
- `api.practice.startSession(sessionData)`
- `api.practice.submitAnswer(sessionId, answerData)`
- `api.practice.getQuestions(testType, section, difficulty)`

### Strengths Assessment
- `api.strengths.getProfile()`
- `api.strengths.saveOnboarding(onboardingData)`
- `api.strengths.updateStrengths(strengthsData)`

### AI Generation
- `api.ai.generateQuiz(content, numQuestions)`
- `api.ai.generateFlashcards(content, numCards)`
- `api.ai.summarizeText(content, style)`
- `api.ai.getJobStatus(jobId)`

### Profile
- `api.profile.getProfile(userId)`
- `api.profile.updateProfile(updates)`
- `api.profile.uploadAvatar(file)`

## Mock Data Features

The localStorage mock data includes:

### Users
- Sample users with different roles (free/premium)
- XP, coins, levels, and badges
- Avatar and profile information

### Tasks
- Various task categories and priorities
- Progress tracking and due dates
- Template support

### Notes
- Rich text content with markdown support
- Folder organization
- Tags and favorites

### Library Items
- Quizzes with multiple choice questions
- Flashcard sets
- Study summaries
- Learning templates

### Competitions
- Different competition types (speed, accuracy, essay)
- Prize structures and rankings
- Participation tracking

### Shop
- Virtual items and cosmetics
- Energy boosts and power-ups
- Purchase history

### Community
- Study servers and channels
- Real-time messaging
- Member management

### Practice Data
- SAT/ACT practice statistics
- Performance tracking
- Strength and weakness analysis

## Production Readiness

When ready to switch to production:

1. **Set `USE_REAL_API = true`** in `apiService.js`
2. **Ensure backend server is running** and accessible
3. **Configure environment variables**:
   - `REACT_APP_BACKEND_URL`: Your backend API URL
4. **Test all features** to ensure API compatibility
5. **Deploy with confidence** - the frontend code remains unchanged

## Benefits

- **Zero Backend Dependencies**: Develop and test without a running backend
- **Instant Data Persistence**: Mock data survives page refreshes
- **Realistic Data**: Comprehensive mock data that mirrors production
- **Easy Switching**: Toggle between mock and real APIs instantly
- **Consistent Interface**: Same API calls regardless of data source
- **Production Ready**: Seamless transition to real APIs when ready

## Data Persistence

All mock data is stored in localStorage and persists between:
- Page refreshes
- Browser sessions
- Development restarts

To reset mock data, clear localStorage in your browser or use:
```javascript
localStorage.clear();
```

## Error Handling

The API layer provides consistent error handling:
- Network errors are caught and logged
- Authentication errors automatically redirect to login
- Validation errors provide user-friendly messages
- Loading states can be tracked through the hook

This architecture ensures a smooth development experience and production-ready deployment.
