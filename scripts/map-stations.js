// Interactive Map Stations System
let currentStationIndex = 0;
let visitedStations = new Set();

function initializeMapStations() {
  const stationsContainer = document.getElementById('stationsContainer');
  const mapWrapper = document.getElementById('mapWrapper');
  
  stationsContainer.innerHTML = '';
  
  // Create stations for each timeline event
 timelineEvents.forEach((event, index) => {
    const station = document.createElement('div');
    station.className = 'station' + (index === 0 ? ' active' : ' locked');
    station.dataset.index = index;
    station.onclick = () => selectStation(index);
    
    const header = document.createElement('div');
    header.className = 'station-header';
    
    const titleDiv = document.createElement('div');
    titleDiv.style.flex = '1';
    
    const title = document.createElement('div');
    title.className = 'station-title';
    title.textContent = event.title;
    
    const date = document.createElement('div');
    date.className = 'station-date';
    date.textContent = event.date;
    
    titleDiv.appendChild(title);
    titleDiv.appendChild(date);
    
    const number = document.createElement('div');
    number.className = 'station-number';
    number.textContent = (index + 1);
    
    header.appendChild(titleDiv);
    header.appendChild(number);
    station.appendChild(header);
    
    stationsContainer.appendChild(station);
  });
  
  // Draw map background with visual elements
  drawMapBackground();
  
  // Initialize first station
  selectStation(0);
}

function selectStation(index) {
  // Check if station is locked
  const station = document.querySelector(`[data-index="${index}"]`);
  if (station.classList.contains('locked')) {
    alert('אנא בקרו וקראו את כל התחנות לפי הסדר');
    return;
  }
  
  currentStationIndex = index;
  const event = timelineEvents[index];
  
  // Update UI
  updateStationUI();
  
  // Mark as visited
  markAsVisited(index);
  
  // Show event details
  showEventDetail(event);
  
  // Scroll to map wrapper
  const mapWrapper = document.getElementById('mapWrapper');
  mapWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateStationUI() {
  // Remove active/visited classes from all stations
  document.querySelectorAll('.station').forEach(s => {
    s.classList.remove('active');
  });
  
  // Update stations
  document.querySelectorAll('.station').forEach((station, index) => {
    if (visitedStations.has(index)) {
      station.classList.add('visited');
      if (!station.classList.contains('locked')) {
        station.classList.remove('locked');
      }
    } else if (index > Math.max(...visitedStations) + 1) {
      station.classList.add('locked');
    }
  });
  
  // Set active station
  const currentStation = document.querySelector(`[data-index="${currentStationIndex}"]`);
  currentStation.classList.add('active');
}

function markAsVisited(index) {
  visitedStations.add(index);
  
  // Unlock next station
  if (index < timelineEvents.length - 1) {
    const nextStation = document.querySelector(`[data-index="${index + 1}"]`);
    nextStation.classList.remove('locked');
  }
  
  updateStationUI();
}

function drawMapBackground() {
  const mapSvg = document.getElementById('mapSvg');
  mapSvg.innerHTML = '';
  
  // Background rectangle
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '1000');
  bg.setAttribute('height', '700');
  bg.setAttribute('fill', 'url(#mapGradient)');
  mapSvg.appendChild(bg);
  
  // Gradient definition
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'mapGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');
  
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#c5e8d5');
  gradient.appendChild(stop1);
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#a8d5ba');
  gradient.appendChild(stop2);
  
  defs.appendChild(gradient);
  mapSvg.appendChild(defs);
  
  // Add some decorative elements representing Europe
  addMapDecorations(mapSvg);
}

function addMapDecorations(mapSvg) {
  // Add regions/zones (abstract representation)
  const zones = [
    { x: 200, y: 150, width: 300, height: 200, label: 'Axis Territory' },
    { x: 600, y: 200, width: 250, height: 150, label: 'Soviet Union' },
    { x: 150, y: 450, width: 200, height: 150, label: 'Neutral/Occupied' }
  ];
  
  zones.forEach(zone => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', zone.x);
    rect.setAttribute('y', zone.y);
    rect.setAttribute('width', zone.width);
    rect.setAttribute('height', zone.height);
    rect.setAttribute('fill', 'rgba(255, 255, 255, 0.1)');
    rect.setAttribute('stroke', '#888');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('stroke-dasharray', '5,5');
    mapSvg.appendChild(rect);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', zone.x + zone.width / 2);
    text.setAttribute('y', zone.y + zone.height / 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dy', '0.3em');
    text.setAttribute('fill', '#555');
    text.setAttribute('font-size', '12');
    text.setAttribute('opacity', '0.6');
    text.textContent = zone.label;
    mapSvg.appendChild(text);
  });
}

function showEventDetail(event) {
  const detailDiv = document.getElementById('event-detail');
  document.getElementById('detail-title').textContent = event.title;
  document.getElementById('detail-date').textContent = event.date;
  document.getElementById('detail-description').textContent = event.description;
  
  const keyPointsDiv = document.getElementById('detail-key-points');
  keyPointsDiv.innerHTML = '<strong>נקודות מפתח:</strong><ul>' + 
    event.keyPoints.map(point => `<li>${point}</li>`).join('') +
    '</ul>';
  
  detailDiv.style.display = 'block';
  detailDiv.scrollIntoView({ behavior: 'smooth' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeMapStations);
