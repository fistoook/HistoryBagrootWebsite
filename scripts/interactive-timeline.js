// Interactive Timeline JavaScript

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
  renderTimeline('all');
  
  // Setup filter listener
  const filterSelect = document.getElementById('timeline-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', function() {
      currentFilter = this.value;
      renderTimeline(currentFilter);
    });
  }
});

function renderTimeline(filter) {
  const timelineContainer = document.getElementById('timeline');
  if (!timelineContainer) return;
  
  timelineContainer.innerHTML = '';
  
  let filteredEvents = timelineEvents;
  if (filter !== 'all') {
    filteredEvents = timelineEvents.filter(event => event.era === filter);
  }
  
  filteredEvents.forEach((event, index) => {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    timelineItem.innerHTML = `
      <div class="timeline-content" onclick="showEventDetail(${event.id})" style="cursor: pointer;">
        <div class="date">${event.date}</div>
        <h4>${event.title}</h4>
        <p style="font-size: 0.9em; color: #666; margin-top: 8px;">${event.description}</p>
        <p style="font-size: 0.85em; color: #999; margin-top: 5px;">לחצו לפרטים נוספים →</p>
      </div>
    `;
    timelineContainer.appendChild(timelineItem);
  });
}

function showEventDetail(eventId) {
  const event = timelineEvents.find(e => e.id === eventId);
  if (!event) return;
  
  const detailContainer = document.getElementById('event-detail');
  if (!detailContainer) return;
  
  const titleEl = document.getElementById('detail-title');
  const dateEl = document.getElementById('detail-date');
  const descEl = document.getElementById('detail-description');
  const keyPointsEl = document.getElementById('detail-key-points');
  
  titleEl.textContent = event.title;
  dateEl.textContent = event.date + ' • ' + event.location;
  descEl.textContent = event.description;
  
  keyPointsEl.innerHTML = '<h4 style="margin-top: 15px; margin-bottom: 10px;">נקודות מפתח:</h4>';
  keyPointsEl.innerHTML += '<ul class="timeline-points">';
  event.keyPoints.forEach(point => {
    keyPointsEl.innerHTML += `<li style="margin-bottom: 8px;">${point}</li>`;
  });
  keyPointsEl.innerHTML += '</ul>';

  keyPointsEl.innerHTML += `<p class="detail-significance"><strong>משמעות:</strong> ${event.significance}</p>`;
  
  detailContainer.style.display = 'block';
  detailContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function closeEventDetail() {
  const detailContainer = document.getElementById('event-detail');
  if (detailContainer) {
    detailContainer.style.display = 'none';
  }
}

// Close detail when clicking outside
document.addEventListener('click', function(event) {
  const detailContainer = document.getElementById('event-detail');
  if (detailContainer && detailContainer.style.display === 'block') {
    if (event.target === detailContainer) {
      closeEventDetail();
    }
  }
});
