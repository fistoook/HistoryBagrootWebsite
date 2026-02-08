// Interactive Europe Map with Timeline Stations
// Learners must visit stations in chronological order

class EuropeTimelineMap {
  constructor(containerId, dataArray) {
    this.container = document.getElementById(containerId);
    this.data = dataArray;
    this.completedStations = new Set(JSON.parse(localStorage.getItem('completedStations') || '[]'));
    this.currentStation = parseInt(localStorage.getItem('currentStation') || '1');
    this.mapViewBox = { x: -15, y: 30, width: 65, height: 35 };
    this.mapScale = 35; // pixels per degree
    this.init();
  }

  init() {
    this.createMapStructure();
    this.renderMap();
    this.renderStations();
    this.renderConnectingPath();
    this.attachEventListeners();
  }

  createMapStructure() {
    this.container.innerHTML = `
      <div class="map-legend">
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
      </div>
      <svg class="timeline-map" viewBox="${this.mapViewBox.x} ${this.mapViewBox.y} ${this.mapViewBox.width} ${this.mapViewBox.height}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrow-active" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#2d7a5e" />
          </marker>
          <marker id="arrow-completed" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#52b788" />
          </marker>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2d7a5e;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#a8d5ba;stop-opacity:0.8" />
          </linearGradient>
        </defs>
        
        <!-- Europe Background Map -->
        <g id="europe-map" class="map-background">
          <path d="M -5 35 L 40 35 L 40 65 L -5 65 Z" fill="#e8f5ef" stroke="#d0e8dc" stroke-width="0.2"/>
        </g>
        
        <!-- Connecting Path -->
        <g id="station-path" class="station-path"></g>
        
        <!-- Stations -->
        <g id="stations" class="stations-group"></g>
      </svg>
      <div class="map-info-panel" id="stationInfo">
        <div class="station-info-content">
          <h2 id="stationTitle">בחרו תחנה</h2>
          <p id="stationDate" class="station-date"></p>
          <p id="stationDescription" class="station-description"></p>
          <div id="stationKeyPoints" class="station-key-points"></div>
          <button id="completeButton" class="complete-button" style="display: none;">סיימתי את התחנה</button>
          <p id="stationStatus" class="station-status"></p>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
        <span class="progress-text" id="progressText">0%</span>
      </div>
    `;
  }

  projectCoords(lat, lon) {
    // Mercator-like projection for European map
    const x = (lon - this.mapViewBox.x) * this.mapScale / this.mapViewBox.width;
    const y = (lat - this.mapViewBox.y) * this.mapScale / this.mapViewBox.height;
    return { x, y };
  }

  renderMap() {
    const mapGroup = document.getElementById('europe-map');
    if (!mapGroup) return;

    // Add a simple background representing Europe
    const europeanCountries = [
      { name: 'Germany', bounds: [[48, 5], [55, 16]] },
      { name: 'Poland', bounds: [[49, 14], [54, 24]] },
      { name: 'France', bounds: [[42.5, -5], [51, 8]] },
      { name: 'Italy', bounds: [[37, 7], [47, 19]] },
      { name: 'Hungary', bounds: [[45.5, 16], [48.5, 23]] },
      { name: 'Ukraine', bounds: [[41, 22], [53, 41]] },
      { name: 'USSR', bounds: [[45, 19], [67, 171]] }
    ];

    // Add grid lines for reference
    for (let lon = -10; lon <= 40; lon += 10) {
      const proj1 = this.projectCoords(30, lon);
      const proj2 = this.projectCoords(68, lon);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', proj1.x);
      line.setAttribute('y1', proj1.y);
      line.setAttribute('x2', proj2.x);
      line.setAttribute('y2', proj2.y);
      line.setAttribute('stroke', '#e8d5d5');
      line.setAttribute('stroke-width', '0.3');
      line.setAttribute('opacity', '0.2');
      mapGroup.appendChild(line);
    }

    for (let lat = 30; lat <= 70; lat += 10) {
      const proj1 = this.projectCoords(lat, -10);
      const proj2 = this.projectCoords(lat, 40);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', proj1.x);
      line.setAttribute('y1', proj1.y);
      line.setAttribute('x2', proj2.x);
      line.setAttribute('y2', proj2.y);
      line.setAttribute('stroke', '#e8d5d5');
      line.setAttribute('stroke-width', '0.3');
      line.setAttribute('opacity', '0.2');
      mapGroup.appendChild(line);
    }
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
        const proj = this.projectCoords(station.mapCoords[0], station.mapCoords[1]);
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
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('opacity', '0.6');
      pathGroup.appendChild(path);
    }
  }

  renderStations() {
    const stationsGroup = document.getElementById('stations');
    if (!stationsGroup) return;

    stationsGroup.innerHTML = ''; // Clear existing stations

    this.data.forEach((station, index) => {
      if (!station.mapCoords) return;

      const proj = this.projectCoords(station.mapCoords[0], station.mapCoords[1]);
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
      bgCircle.setAttribute('r', '2');
      bgCircle.setAttribute('fill', isCompleted ? '#52b788' : isCurrent ? '#2d7a5e' : '#ccc');
      bgCircle.setAttribute('opacity', isLocked ? '0.4' : '1');
      stationGroup.appendChild(bgCircle);

      // Highlight ring for current
      if (isCurrent) {
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', proj.x);
        ring.setAttribute('cy', proj.y);
        ring.setAttribute('r', '2.5');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#2d7a5e');
        ring.setAttribute('stroke-width', '0.5');
        ring.setAttribute('opacity', '0.6');
        stationGroup.appendChild(ring);

        // Animated pulse for current
        const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulse.setAttribute('cx', proj.x);
        pulse.setAttribute('cy', proj.y);
        pulse.setAttribute('r', '2.5');
        pulse.setAttribute('fill', 'none');
        pulse.setAttribute('stroke', '#2d7a5e');
        pulse.setAttribute('stroke-width', '0.5');
        pulse.setAttribute('class', 'pulse-ring');
        stationGroup.appendChild(pulse);
      }

      // Station number
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', proj.x);
      text.setAttribute('y', proj.y + 0.4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '1');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', isLocked ? '#999' : 'white');
      text.setAttribute('pointer-events', 'none');
      text.textContent = station.id;
      stationGroup.appendChild(text);

      // Tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${station.title} (${station.date})${isLocked ? ' - נעול עד שתשלימו את התחנה הקודמת' : ''}`;
      stationGroup.appendChild(title);

      // Click handler
      if (!isLocked) {
        stationGroup.addEventListener('click', () => this.showStationInfo(station));
        stationGroup.addEventListener('mouseenter', () => {
          bgCircle.setAttribute('r', '2.8');
        });
        stationGroup.addEventListener('mouseleave', () => {
          bgCircle.setAttribute('r', '2');
        });
      }

      stationsGroup.appendChild(stationGroup);
    });
  }

  showStationInfo(station) {
    const titleEl = document.getElementById('stationTitle');
    const dateEl = document.getElementById('stationDate');
    const descEl = document.getElementById('stationDescription');
    const keyPointsEl = document.getElementById('stationKeyPoints');
    const completeBtn = document.getElementById('completeButton');
    const statusEl = document.getElementById('stationStatus');

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

    if (isCurrent && !isCompleted) {
      completeBtn.style.display = 'block';
      completeBtn.onclick = () => this.completeStation(station.id);
      statusEl.innerHTML = '<span class="status-unlock">👈 לחצו את הכפתור כדי לסיים התחנה ולהמשיך לתחנה הבאה</span>';
    } else if (isCompleted) {
      completeBtn.style.display = 'none';
      statusEl.innerHTML = '<span class="status-completed">✓ כבר ביקרתם בתחנה זו</span>';
    } else {
      completeBtn.style.display = 'none';
      statusEl.innerHTML = '<span class="status-locked">🔒 יש צורך לשלים את התחנות הקודמות קודם</span>';
    }

    // Scroll to info panel
    document.getElementById('stationInfo').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  completeStation(stationId) {
    this.completedStations.add(stationId);
    localStorage.setItem('completedStations', JSON.stringify(Array.from(this.completedStations)));

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
