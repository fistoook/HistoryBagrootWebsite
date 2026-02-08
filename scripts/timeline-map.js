// Interactive Europe Map with Timeline Stations
// Learners must visit stations in chronological order

class EuropeTimelineMap {
  constructor(containerId, dataArray) {
    this.container = document.getElementById(containerId);
    this.data = dataArray;
    this.completedStations = new Set(JSON.parse(localStorage.getItem('completedStations') || '[]'));
    this.currentStation = parseInt(localStorage.getItem('currentStation') || '1');
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
    image.setAttribute('href', 'images/map.jpg');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'images/map.jpg');
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
    svg.insertBefore(image, svg.childNodes[svg.childNodes.length - 1]);}

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

    // Add info panel
    const infoPanel = document.createElement('div');
    infoPanel.className = 'map-info-panel';
    infoPanel.id = 'stationInfo';
    infoPanel.innerHTML = `
      <div class="station-info-content">
        <h2 id="stationTitle">בחרו תחנה</h2>
        <p id="stationDate" class="station-date"></p>
        <p id="stationDescription" class="station-description"></p>
        <div id="stationKeyPoints" class="station-key-points"></div>
        <button id="completeButton" class="complete-button" style="display: none;">סיימתי את התחנה</button>
        <p id="stationStatus" class="station-status"></p>
      </div>
    `;
    this.container.appendChild(infoPanel);
  }

  projectCoords(lat, lon) {
    // Map actual coordinates to viewBox percentages
    // Latitude range: 30 to 67 (maps to viewBox 0-80)
    // Longitude range: -9 to 41 (maps to viewBox 0-100)
    const latMin = 30, latMax = 67;
    const lonMin = -9, lonMax = 41;
    
    const x = ((lon - lonMin) / (lonMax - lonMin)) * 100;
    const y = ((latMax - lat) / (latMax - latMin)) * 80; // inverted because SVG y increases downward
    
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

      // Station number
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
