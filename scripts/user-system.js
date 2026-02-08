// User System - Registration, Profiles, and Avatars

const HISTORICAL_FIGURES = [
  { id: 'churchill', name: 'ווינסטון צ\'רצ\'יל', title: 'ראש ממשלה בריטי', icon: '🎩', color: '#1f4788' },
  { id: 'roosevelt', name: 'פרנקלין רוזוולט', title: 'נשיא ארה"ב', icon: '🤠', color: '#2E5C8A' },
  { id: 'naked_frog', name: 'עוזר כימי', title: 'סוכן שנתי', icon: '🐸', color: '#5D9F2F' },
  { id: 'einstein', name: 'אלברט איינשטיין', title: 'פיזיקאי', icon: '👨‍🔬', color: '#8B4513' },
  { id: 'florence', name: 'פלורנס נייטינגל', title: 'אחות חסדים', icon: '🏥', color: '#E91E63' },
  { id: 'ada', name: 'אדה לאבליס', title: 'מתמטיקאית', icon: '🔢', color: '#FF6F00' },
  { id: 'joan', name: 'ז\'אן דה ארק', title: 'גיבורת צרפת', icon: '⚔️', color: '#FFD700' },
  { id: 'eva', name: 'אוה פרון', title: 'דוכסת בהירות', icon: '👑', color: '#B8860B' }
];

const ACHIEVEMENTS_SYSTEM = {
  'first_5': {
    name: 'הכנסן צעיר',
    description: 'השלמת 5 תחנות ראשונות',
    icon: '🌱',
    rewards: { title: 'דוקטור ישיר' }
  },
  'first_10': {
    name: 'חוקר היסטוריה',
    description: 'משפחתך כעת בן 10 תחנות',
    icon: '🔍',
    rewards: { title: 'פרופ\' כבוד', frame: 'bronze' }
  },
  'halfway': {
    name: 'גלגל ההיסטוריה',
    description: 'הגיע ל-17 תחנות - חצי הדרך!',
    icon: '⚙️',
    rewards: { title: 'חוקר בכיר', frame: 'silver' }
  },
  'champion': {
    name: 'גיבור אל',
    description: 'השלמת את כל 34 תחנות!',
    icon: '🏆',
    rewards: { title: 'מנצח היסטוריה', frame: 'gold', crown: true }
  },
  'points_100': {
    name: 'זומן של הידע',
    description: 'צברת 100 נקודות',
    icon: '⭐',
    rewards: { title: 'עמוד של הידע' }
  },
  'perfect': {
    name: 'תשובה מושלמת',
    description: 'ענית נכון ל-30 שאלות',
    icon: '💯',
    rewards: { title: 'חכם היום', frame: 'platinum' }
  },
  'speedrunner': {
    name: 'מהיר כברק',
    description: 'השלמת 10 תחנות ב-1 שעה',
    icon: '⚡',
    rewards: { title: 'נוקד מהיר' }
  },
  'perfectionist': {
    name: 'לא יהיה שגיאה',
    description: 'ענית נכון ב-100% מהשאלות',
    icon: '✨',
    rewards: { title: 'מדע מושלם' }
  }
};

class UserSystem {
  constructor() {
    this.currentUser = this.loadCurrentUser();
  }

  // Create new user profile
  createUser(username, email, selectedAvatar) {
    const user = {
      id: this.generateUserId(),
      username,
      email,
      avatar: selectedAvatar,
      createdDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      points: 0,
      level: 1,
      completedStations: [],
      achievements: [],
      timeSpent: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      avatarTitle: '',
      avatarFrame: 'none',
      avatarCrown: false,
      statistics: {
        totalQuizzes: 0,
        averageScore: 0,
        streakDays: 0,
        lastVisit: new Date().toISOString()
      }
    };

    // Save user to localStorage
    const users = this.getAllUsers();
    users[user.id] = user;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(user));

    this.currentUser = user;
    return user;
  }

  // Load existing user
  loadUser(userId, password) {
    // In a production app, this would authenticate against a backend
    const users = this.getAllUsers();
    const user = users[userId];

    if (user) {
      user.lastLogin = new Date().toISOString();
      user.statistics.lastVisit = new Date().toISOString();
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUser = user;
      return user;
    }
    return null;
  }

  // Get current logged-in user
  getCurrentUser() {
    return this.currentUser;
  }

  // Load current user from localStorage
  loadCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }

  // Get all users
  getAllUsers() {
    const usersData = localStorage.getItem('users');
    return usersData ? JSON.parse(usersData) : {};
  }

  // Check if username exists
  usernameExists(username) {
    const users = this.getAllUsers();
    return Object.values(users).some(user => user.username.toLowerCase() === username.toLowerCase());
  }

  // Update user profile
  updateUser(updates) {
    if (!this.currentUser) return null;

    this.currentUser = { ...this.currentUser, ...updates };
    
    const users = this.getAllUsers();
    users[this.currentUser.id] = this.currentUser;
    
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

    return this.currentUser;
  }

  // Add points and handle level up
  addPoints(amount) {
    if (!this.currentUser) return;

    const oldLevel = this.currentUser.level;
    this.currentUser.points += amount;
    this.currentUser.level = Math.floor(this.currentUser.points / 100) + 1;

    if (this.currentUser.level > oldLevel) {
      this.showLevelUp();
    }

    this.updateUser({ points: this.currentUser.points, level: this.currentUser.level });
  }

  // Add achievement
  addAchievement(achievementId) {
    if (!this.currentUser || this.currentUser.achievements.includes(achievementId)) {
      return;
    }

    this.currentUser.achievements.push(achievementId);
    const achievement = ACHIEVEMENTS_SYSTEM[achievementId];

    if (achievement && achievement.rewards) {
      if (achievement.rewards.title) {
        this.currentUser.avatarTitle = achievement.rewards.title;
      }
      if (achievement.rewards.frame) {
        this.currentUser.avatarFrame = achievement.rewards.frame;
      }
      if (achievement.rewards.crown) {
        this.currentUser.avatarCrown = true;
      }
    }

    this.updateUser({
      achievements: this.currentUser.achievements,
      avatarTitle: this.currentUser.avatarTitle,
      avatarFrame: this.currentUser.avatarFrame,
      avatarCrown: this.currentUser.avatarCrown
    });
  }

  // Logout
  logout() {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
    window.location.href = 'auth.html';
  }

  // Generate unique user ID
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Show level up celebration
  showLevelUp() {
    const levelUpModal = document.createElement('div');
    levelUpModal.className = 'level-up-modal';
    levelUpModal.innerHTML = `
      <div class="level-up-content">
        <h2>🎉 עלית בדרגה!</h2>
        <p class="level-display">רמה ${this.currentUser.level}</p>
        <p>כל הכבוד! המשך ללמוד וזכה בהישגים נוספים!</p>
        <button onclick="this.parentElement.parentElement.remove()">סגור</button>
      </div>
    `;
    document.body.appendChild(levelUpModal);
    setTimeout(() => levelUpModal.classList.add('show'), 100);
    setTimeout(() => {
      levelUpModal.classList.remove('show');
      setTimeout(() => levelUpModal.remove(), 500);
    }, 3000);
  }
}

// Initialize user system
const userSystem = new UserSystem();
