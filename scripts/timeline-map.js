// Interactive Europe Map with Timeline Stations
// Learners must visit stations in chronological order

class EuropeTimelineMap {
  constructor(containerId, dataArray) {
    // Check if user is logged in
    this.user = userSystem ? userSystem.getCurrentUser() : null;
    if (!this.user) {
      // Redirect to auth if no user logged in
      window.location.href = 'auth.html';
      return;
    }

    this.container = document.getElementById(containerId);
    this.data = dataArray;
    this.completedStations = new Set(this.user.completedStations || []);
    this.currentStation = parseInt(localStorage.getItem('currentStation') || '1');
    
    // Use user system for gamification
    this.points = this.user.points || 0;
    this.achievements = new Set(this.user.achievements || []);
    this.correctAnswers = this.user.correctAnswers || 0;
    
    // Adjust viewBox to match typical map proportions
    this.mapViewBox = { x: 0, y: 0, width: 100, height: 80 };
    this.mapScale = 1;
    this.init();
  }

  init() {
    this.createMapStructure();
    this.renderStations();
    this.renderConnectingPath();
    this.attachEventListeners();
    this.displayUserProfile();
  }

  displayUserProfile() {
    const profileHeader = document.getElementById('userProfileHeader');
    if (profileHeader && this.user) {
      const figure = HISTORICAL_FIGURES.find(f => f.id === this.user.avatar);
      document.getElementById('userProfileName').textContent = this.user.username;
      if (figure) {
        document.getElementById('userProfileIcon').textContent = figure.icon;
      }
      profileHeader.style.display = 'flex';
    }
  }

  createMapStructure() {
    if (!this.container) {
      console.error('Map container not found!');
      return;
    }

    // Clear container
    this.container.innerHTML = '';

    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = `
      <div class="progress-fill" id="progressFill"></div>
      <span class="progress-text" id="progressText">0%</span>
    `;
    this.container.appendChild(progressBar);

    // Create gamification stats panel
    const statsPanel = document.createElement('div');
    statsPanel.className = 'gamification-stats';
    statsPanel.id = 'statsPanel';
    statsPanel.innerHTML = `
      <div class="stats-item">
        <div class="stat-icon">⭐</div>
        <div class="stat-content">
          <div class="stat-label">נקודות</div>
          <div class="stat-value" id="pointsDisplay">0</div>
        </div>
      </div>
      <div class="stats-item">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-label">רמה</div>
          <div class="stat-value" id="levelDisplay">1</div>
        </div>
      </div>
      <div class="stats-item">
        <div class="stat-icon">🏆</div>
        <div class="stat-content">
          <div class="stat-label">תגים</div>
          <div class="stat-value" id="badgesDisplay">0</div>
        </div>
      </div>
      <div class="stats-item">
        <div class="stat-icon">✓</div>
        <div class="stat-content">
          <div class="stat-label">תשובות נכונות</div>
          <div class="stat-value" id="correctAnswersDisplay">0</div>
        </div>
      </div>
      <button class="achievements-btn" id="achievementsBtn">הישגים 🎖️</button>
    `;
    this.container.appendChild(statsPanel);

    // Create legend HTML
    const legend = document.createElement('div');
    legend.className = 'map-legend';
    legend.innerHTML = `
      <h3>מפת התחנות - ציר הזמן המלא</h3>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-marker locked"></span>
          <span>תחנה נעולה</span>
        </div>
        <div class="legend-item">
          <span class="legend-marker current"></span>
          <span>התחנה הנוכחית</span>
        </div>
        <div class="legend-item">
          <span class="legend-marker completed"></span>
          <span>תחנה שביקרתם בה</span>
        </div>
      </div>
    `;
    this.container.appendChild(legend);

    // Create SVG element properly
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'timeline-map');
    svg.setAttribute('viewBox', `${this.mapViewBox.x} ${this.mapViewBox.y} ${this.mapViewBox.width} ${this.mapViewBox.height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', svgNS);

    // Add defs
    const defs = document.createElementNS(svgNS, 'defs');
    
    const marker1 = document.createElementNS(svgNS, 'marker');
    marker1.setAttribute('id', 'arrow-active');
    marker1.setAttribute('markerWidth', '10');
    marker1.setAttribute('markerHeight', '10');
    marker1.setAttribute('refX', '9');
    marker1.setAttribute('refY', '3');
    marker1.setAttribute('orient', 'auto');
    marker1.setAttribute('markerUnits', 'strokeWidth');
    const path1 = document.createElementNS(svgNS, 'path');
    path1.setAttribute('d', 'M0,0 L0,6 L9,3 z');
    path1.setAttribute('fill', '#2d7a5e');
    marker1.appendChild(path1);
    defs.appendChild(marker1);

    const marker2 = document.createElementNS(svgNS, 'marker');
    marker2.setAttribute('id', 'arrow-completed');
    marker2.setAttribute('markerWidth', '10');
    marker2.setAttribute('markerHeight', '10');
    marker2.setAttribute('refX', '9');
    marker2.setAttribute('refY', '3');
    marker2.setAttribute('orient', 'auto');
    marker2.setAttribute('markerUnits', 'strokeWidth');
    const path2 = document.createElementNS(svgNS, 'path');
    path2.setAttribute('d', 'M0,0 L0,6 L9,3 z');
    path2.setAttribute('fill', '#52b788');
    marker2.appendChild(path2);
    defs.appendChild(marker2);

    const gradient = document.createElementNS(svgNS, 'linearGradient');
    gradient.setAttribute('id', 'pathGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    const stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('style', 'stop-color:#2d7a5e;stop-opacity:0.3');
    gradient.appendChild(stop1);
    const stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('style', 'stop-color:#a8d5ba;stop-opacity:0.8');
    gradient.appendChild(stop2);
    defs.appendChild(gradient);

    svg.appendChild(defs);

    // Add map image as background
    const image = document.createElementNS(svgNS, 'image');
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', '100');
    image.setAttribute('height', '80');
    // Use both xlink:href (for better compatibility) and href
    image.setAttribute('href', 'images/Nazi_Germany.svg.png');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'images/Nazi_Germany.svg.png');
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.appendChild(image);

    // Add background rect (fallback for when image doesn't load)
    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', '100');
    bg.setAttribute('height', '80');
    bg.setAttribute('fill', '#ffffff');
    bg.setAttribute('stroke', '#d0e8dc');
    bg.setAttribute('stroke-width', '0.5');
    // Place this BEFORE the image so it's in the background
    svg.insertBefore(bg, svg.firstChild);
    // Also ensure image loads properly, move it after bg
    svg.removeChild(image);
    svg.insertBefore(image, svg.childNodes[svg.childNodes.length - 1]);

    // Add groups
    const europeMap = document.createElementNS(svgNS, 'g');
    europeMap.setAttribute('id', 'europe-map');
    europeMap.setAttribute('class', 'map-background');
    svg.appendChild(europeMap);

    const stationPath = document.createElementNS(svgNS, 'g');
    stationPath.setAttribute('id', 'station-path');
    stationPath.setAttribute('class', 'station-path');
    svg.appendChild(stationPath);

    const stations = document.createElementNS(svgNS, 'g');
    stations.setAttribute('id', 'stations');
    stations.setAttribute('class', 'stations-group');
    svg.appendChild(stations);

    // Add SVG to container
    this.container.appendChild(svg);

    // Add modal for station info and quiz
    const modal = document.createElement('div');
    modal.className = 'station-modal';
    modal.id = 'stationModal';
    modal.innerHTML = `
      <div class="modal-overlay" id="modalOverlay"></div>
      <div class="modal-content">
        <button class="modal-close" id="modalClose">×</button>
        <div class="modal-body">
          <h2 id="modalTitle" class="modal-title"></h2>
          <p id="modalDate" class="modal-date"></p>
          <p id="modalDescription" class="modal-description"></p>
          <div id="modalKeyPoints" class="modal-key-points"></div>
          
          <div id="quizSection" class="quiz-section">
            <h3 class="quiz-title">שאלת ביקורת</h3>
            <p id="quizQuestion" class="quiz-question"></p>
            <div id="quizOptions" class="quiz-options"></div>
            <p id="quizFeedback" class="quiz-feedback"></p>
          </div>
        </div>
      </div>
    `;
    this.container.appendChild(modal);

    // Add modal event listeners
    modal.querySelector('#modalClose').addEventListener('click', () => this.closeModal());
    modal.querySelector('#modalOverlay').addEventListener('click', () => this.closeModal());
  }

  projectCoords(lat, lon, stationId) {
    // Create a timeline path: stations progress left to right chronologically
    // with a wave pattern (ups and downs) for visual interest
    
    // Total stations: 34
    // Distribute across viewBox width (0-100) with padding
    const totalStations = this.data.length;
    const xStart = 5;  // Start 5% from left
    const xEnd = 95;   // End 95% from right
    const xRange = xEnd - xStart;
    
    // Position along timeline based on station ID
    const stationIndex = stationId - 1; // Convert 1-based to 0-based
    const x = xStart + (stationIndex / (totalStations - 1)) * xRange;
    
    // Create wave pattern using sine function
    // Oscillate between y values 20 and 60 with 3 complete waves
    const yMin = 20;
    const yMax = 60;
    const yMid = (yMin + yMax) / 2;
    const yAmplitude = (yMax - yMin) / 2;
    const waveCount = 3; // Number of complete sine waves
    const y = yMid + yAmplitude * Math.sin((stationIndex / (totalStations - 1)) * waveCount * Math.PI * 2);
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(80, y)) };
  }

  renderMap() {
    // Map rendering via background image - no need to draw countries
  }

  renderConnectingPath() {
    const pathGroup = document.getElementById('station-path');
    if (!pathGroup || this.data.length < 2) return;

    pathGroup.innerHTML = ''; // Clear existing paths

    // Create the connecting line between stations
    let pathData = '';
    let isFirstPoint = true;

    this.data.forEach((station, index) => {
      if (station.mapCoords) {
        const proj = this.projectCoords(station.mapCoords[0], station.mapCoords[1], station.id);
        if (isFirstPoint) {
          pathData += `M ${proj.x} ${proj.y}`;
          isFirstPoint = false;
        } else {
          pathData += ` L ${proj.x} ${proj.y}`;
        }
      }
    });

    if (pathData) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', 'url(#pathGradient)');
      path.setAttribute('stroke-width', '0.8');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('opacity', '0.8');
      pathGroup.appendChild(path);
    }
  }

  renderStations() {
    const stationsGroup = document.getElementById('stations');
    if (!stationsGroup) return;

    stationsGroup.innerHTML = ''; // Clear existing stations

    this.data.forEach((station, index) => {
      if (!station.mapCoords) return;

      const proj = this.projectCoords(station.mapCoords[0], station.mapCoords[1], station.id);
      const isCompleted = this.completedStations.has(station.id);
      const isCurrent = this.currentStation === station.id;
      const isLocked = !isCompleted && !isCurrent;

      // Create station group
      const stationGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      stationGroup.setAttribute('class', `station-marker ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`);
      stationGroup.setAttribute('data-id', station.id);
      stationGroup.style.cursor = isLocked ? 'not-allowed' : 'pointer';

      // Background circle
      const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bgCircle.setAttribute('cx', proj.x);
      bgCircle.setAttribute('cy', proj.y);
      bgCircle.setAttribute('r', '1.2');
      bgCircle.setAttribute('fill', isCompleted ? '#52b788' : isCurrent ? '#2d7a5e' : '#ccc');
      bgCircle.setAttribute('opacity', isLocked ? '0.4' : '1');
      bgCircle.setAttribute('stroke', 'white');
      bgCircle.setAttribute('stroke-width', '0.6');
      stationGroup.appendChild(bgCircle);

      // Highlight ring for current
      if (isCurrent) {
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', proj.x);
        ring.setAttribute('cy', proj.y);
        ring.setAttribute('r', '1.8');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#2d7a5e');
        ring.setAttribute('stroke-width', '0.3');
        ring.setAttribute('opacity', '0.6');
        stationGroup.appendChild(ring);

        // Animated pulse for current
        const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulse.setAttribute('cx', proj.x);
        pulse.setAttribute('cy', proj.y);
        pulse.setAttribute('r', '1.8');
        pulse.setAttribute('fill', 'none');
        pulse.setAttribute('stroke', '#2d7a5e');
        pulse.setAttribute('stroke-width', '0.3');
        pulse.setAttribute('class', 'pulse-ring');
        stationGroup.appendChild(pulse);
      }

      // Station number or checkmark for completed
      if (isCompleted) {
        // Add checkmark for completed stations
        const checkmark = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        checkmark.setAttribute('x', proj.x);
        checkmark.setAttribute('y', proj.y + 0.4);
        checkmark.setAttribute('text-anchor', 'middle');
        checkmark.setAttribute('font-size', '1.2');
        checkmark.setAttribute('font-weight', 'bold');
        checkmark.setAttribute('fill', 'white');
        checkmark.setAttribute('pointer-events', 'none');
        checkmark.setAttribute('class', 'station-checkmark');
        checkmark.textContent = '✓';
        stationGroup.appendChild(checkmark);
      } else {
        // Station number for non-completed stations
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', proj.x);
        text.setAttribute('y', proj.y + 0.25);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '0.6');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', isLocked ? '#999' : 'white');
        text.setAttribute('pointer-events', 'none');
        text.textContent = station.id;
        stationGroup.appendChild(text);
      }

      // Tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${station.title} (${station.date})${isLocked ? ' - נעול עד שתשלימו את התחנה הקודמת' : ''}`;
      stationGroup.appendChild(title);

      // Click handler - ensure clickability
      stationGroup.setAttribute('pointer-events', 'auto');
      stationGroup.style.cursor = isLocked ? 'not-allowed' : 'pointer';
      if (!isLocked) {
        stationGroup.addEventListener('click', () => this.showStationInfo(station));
        stationGroup.addEventListener('mouseenter', () => {
          bgCircle.setAttribute('r', '1.8');
        });
        stationGroup.addEventListener('mouseleave', () => {
          bgCircle.setAttribute('r', '1.2');
        });
      }

      stationsGroup.appendChild(stationGroup);
    });
  }

  showStationInfo(station) {
    const modal = document.getElementById('stationModal');
    const titleEl = document.getElementById('modalTitle');
    const dateEl = document.getElementById('modalDate');
    const descEl = document.getElementById('modalDescription');
    const keyPointsEl = document.getElementById('modalKeyPoints');
    const quizSection = document.getElementById('quizSection');
    const quizQuestion = document.getElementById('quizQuestion');
    const quizOptions = document.getElementById('quizOptions');
    const quizFeedback = document.getElementById('quizFeedback');

    // Populate station info
    titleEl.textContent = station.title;
    dateEl.textContent = `${station.date} • ${station.location}`;
    descEl.textContent = station.description;

    keyPointsEl.innerHTML = '<h4>נקודות מפתח:</h4><ul class="key-points-list">';
    station.keyPoints.forEach(point => {
      keyPointsEl.innerHTML += `<li>${point}</li>`;
    });
    keyPointsEl.innerHTML += '</ul>';
    keyPointsEl.innerHTML += `<p class="significance"><strong>משמעות היסטורית:</strong> ${station.significance}</p>`;

    const isCompleted = this.completedStations.has(station.id);
    const isCurrent = this.currentStation === station.id;

    // Show quiz only if this is the current station and not yet completed
    if (isCurrent && !isCompleted && station.quiz) {
      quizSection.style.display = 'block';
      quizQuestion.textContent = station.quiz.question;
      quizFeedback.textContent = '';
      quizFeedback.className = 'quiz-feedback';
      
      // Render quiz options
      quizOptions.innerHTML = '';
      station.quiz.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'quiz-option';
        optionBtn.textContent = option;
        optionBtn.onclick = () => this.checkAnswer(station, index, optionBtn);
        quizOptions.appendChild(optionBtn);
      });
    } else if (isCompleted) {
      quizSection.style.display = 'block';
      quizQuestion.textContent = 'כבר ביקרתם בתחנה זו ✓';
      quizOptions.innerHTML = '';
      quizFeedback.textContent = 'תחנה זו הושלמה בהצלחה!';
      quizFeedback.className = 'quiz-feedback success';
    } else {
      quizSection.style.display = 'none';
    }

    // Show modal
    modal.classList.add('active');
  }

  closeModal() {
    const modal = document.getElementById('stationModal');
    modal.classList.remove('active');
  }

  checkAnswer(station, selectedIndex, selectedButton) {
    const quizFeedback = document.getElementById('quizFeedback');
    const quizOptions = document.getElementById('quizOptions');
    const allButtons = quizOptions.querySelectorAll('.quiz-option');
    
    // Disable all buttons after answer
    allButtons.forEach(btn => btn.disabled = true);
    
    if (selectedIndex === station.quiz.correctAnswer) {
      selectedButton.classList.add('correct');
      
      // Award points
      const pointsAwarded = 10;
      this.awardPoints(pointsAwarded);
      this.correctAnswers++;
      localStorage.setItem('correctAnswers', this.correctAnswers.toString());
      
      // Update user system
      if (this.user && userSystem) {
        this.user.correctAnswers = this.correctAnswers;
        userSystem.updateUser({ correctAnswers: this.correctAnswers });
      }
      
      quizFeedback.innerHTML = `כל הכבוד! תשובה נכונה ✓<br><span class="points-animation">+${pointsAwarded} נקודות!</span>`;
      quizFeedback.className = 'quiz-feedback success';
      
      // Trigger confetti animation
      this.triggerConfetti();
      
      // Wait 1.5 seconds, then complete station and close modal
      setTimeout(() => {
        this.completeStation(station.id);
        this.closeModal();
      }, 1500);
    } else {
      selectedButton.classList.add('incorrect');
      // Show correct answer
      allButtons[station.quiz.correctAnswer].classList.add('correct');
      quizFeedback.textContent = 'תשובה שגויה. נסו שוב לאחר קריאה נוספת של החומר.';
      quizFeedback.className = 'quiz-feedback error';
      
      // Re-enable buttons after 2 seconds
      setTimeout(() => {
        allButtons.forEach(btn => {
          btn.disabled = false;
          btn.classList.remove('correct', 'incorrect');
        });
        quizFeedback.textContent = '';
      }, 3000);
    }
  }

  completeStation(stationId) {
    // Find and animate the completed station
    const stationMarker = document.querySelector(`.station-marker[data-id="${stationId}"]`);
    if (stationMarker) {
      stationMarker.classList.add('completing');
      // Remove animation class after animation completes
      setTimeout(() => {
        stationMarker.classList.remove('completing');
      }, 800);
    }

    this.completedStations.add(stationId);
    localStorage.setItem('completedStations', JSON.stringify(Array.from(this.completedStations)));
    
    // Update user system
    if (this.user && userSystem) {
      const completedList = Array.from(this.completedStations);
      userSystem.updateUser({ completedStations: completedList });
    }

    // Move to next station
    const nextStation = this.data.find(s => s.id === stationId + 1);
    if (nextStation) {
      this.currentStation = nextStation.id;
      localStorage.setItem('currentStation', this.currentStation.toString());
    }

    this.updateProgress();
    this.renderStations();
    this.showCompletionMessage();
  }

  updateProgress() {
    const progress = (this.completedStations.size / this.data.length) * 100;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (progressFill) {
      progressFill.style.width = progress + '%';
    }
    if (progressText) {
      progressText.textContent = Math.round(progress) + '%';
    }
  }

  showCompletionMessage() {
    const totalStations = this.data.length;
    if (this.completedStations.size === totalStations) {
      alert('🎉 מזל טוב! סיימתם את כל התחנות! אתם מוכנים לבחינת הבגרות בהיסטוריה!');
    }
  }

  attachEventListeners() {
    this.updateProgress();
    this.updateStatsDisplay();
    
    // Achievements button
    const achievementsBtn = document.getElementById('achievementsBtn');
    if (achievementsBtn) {
      achievementsBtn.addEventListener('click', () => this.showAchievements());
    }
  }

  resetProgress() {
    if (confirm('האם אתם בטוחים שברצונכם לאפס את ההתקדמות?')) {
      this.completedStations.clear();
      this.currentStation = 1;
      localStorage.removeItem('completedStations');
      localStorage.removeItem('currentStation');
      this.init();
    }
  }

  awardPoints(amount) {
    this.points += amount;
    localStorage.setItem('mapPoints', this.points.toString());
    
    // Update user system if available
    if (this.user && userSystem) {
      userSystem.addPoints(amount);
    }
    
    this.updateStatsDisplay();
    this.checkAchievements();
  }

  getLevel() {
    return Math.floor(this.points / 100) + 1;
  }

  checkAchievements() {
    const achievements = [
      { id: 'first_5', name: 'הכנסן צעיר 🌱', condition: this.completedStations.size >= 5 },
      { id: 'first_10', name: 'חוקר היסטוריה 🔍', condition: this.completedStations.size >= 10 },
      { id: 'halfway', name: 'גלגל ההיסטוריה ⚙️', condition: this.completedStations.size >= 17 },
      { id: 'champion', name: 'גיבור אל 🏆', condition: this.completedStations.size === 34 },
      { id: 'points_100', name: 'זומן של הידע ⭐', condition: this.points >= 100 },
      { id: 'perfect', name: 'תשובה מושלמת 💯', condition: this.correctAnswers >= 30 }
    ];

    achievements.forEach(ach => {
      if (ach.condition && !this.achievements.has(ach.id)) {
        this.achievements.add(ach.id);
        localStorage.setItem('mapAchievements', JSON.stringify(Array.from(this.achievements)));
        
        // Update user system if available
        if (this.user && userSystem) {
          userSystem.addAchievement(ach.id);
        }
        
        this.showAchievementBadge(ach.name);
      }
    });
  }

  showAchievementBadge(badgeName) {
    const badge = document.createElement('div');
    badge.className = 'achievement-badge';
    badge.innerHTML = `<span>🎖️ ${badgeName}</span>`;
    document.body.appendChild(badge);

    setTimeout(() => {
      badge.classList.add('show');
    }, 10);

    setTimeout(() => {
      badge.classList.remove('show');
      setTimeout(() => badge.remove(), 500);
    }, 3000);
  }

  updateStatsDisplay() {
    const level = this.getLevel();
    const pointsDisplay = document.getElementById('pointsDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const badgesDisplay = document.getElementById('badgesDisplay');
    const correctAnswersDisplay = document.getElementById('correctAnswersDisplay');

    if (pointsDisplay) pointsDisplay.textContent = this.points;
    if (levelDisplay) levelDisplay.textContent = level;
    if (badgesDisplay) badgesDisplay.textContent = this.achievements.size;
    if (correctAnswersDisplay) correctAnswersDisplay.textContent = this.correctAnswers;
  }

  triggerConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-container';
    
    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.backgroundColor = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'][Math.floor(Math.random() * 5)];
      piece.style.animationDelay = Math.random() * 0.3 + 's';
      confetti.appendChild(piece);
    }
    
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
  }

  showAchievements() {
    const achievementsList = [
      { id: 'first_5', name: 'התחלה טובה! 🌟', desc: 'השלם 5 תחנות' },
      { id: 'first_10', name: 'בדרך הנכונה! 🎯', desc: 'השלם 10 תחנות' },
      { id: 'halfway', name: 'חצי דרך! 🏃', desc: 'השלם 17 תחנות' },
      { id: 'champion', name: 'גיבור הלמידה! 🏆', desc: 'השלם את כל 34 התחנות' },
      { id: 'points_100', name: 'צובר נקודות! 💯', desc: 'צבור 100 נקודות' },
      { id: 'perfect', name: 'מושלם! ⭐', desc: 'ענה נכון ל-30 שאלות' }
    ];

    const modal = document.createElement('div');
    modal.className = 'achievements-modal';
    modal.innerHTML = `
      <div class="achievements-content">
        <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
        <h2>🎖️ ההישגים שלך</h2>
        <div class="achievements-grid">
          ${achievementsList.map(ach => `
            <div class="achievement-card ${this.achievements.has(ach.id) ? 'unlocked' : 'locked'}">
              <div class="achievement-badge-img">${ach.name.split(' ')[1]}</div>
              <div class="achievement-name">${ach.name}</div>
              <div class="achievement-desc">${ach.desc}</div>
              ${this.achievements.has(ach.id) ? '<div class="unlocked-badge">✓ בעל</div>' : '<div class="locked-badge">🔒 נעול</div>'}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('active');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const mapContainer = document.getElementById('mapContainer');
  if (mapContainer && typeof timelineEventsWithCoordinates !== 'undefined') {
    const timelineMap = new EuropeTimelineMap('mapContainer', timelineEventsWithCoordinates);
    
    // Add reset button if desired
    const resetBtn = document.querySelector('.reset-button');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => timelineMap.resetProgress());
    }
  }
});
