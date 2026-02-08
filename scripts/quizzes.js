// Quizzes JavaScript

let currentQuiz = null;
let userAnswers = {};
let startTime = null;

function startQuiz(quizId) {
  // Add practice exam data if it doesn't exist
  if (quizId === 'practice-exam') {
    createPracticeExam();
  }
  
  currentQuiz = quizzes[quizId];
  if (!currentQuiz) {
    alert('החידון לא נמצא.');
    return;
  }
  
  userAnswers = {};
  startTime = new Date();
  
  const selectionSection = document.getElementById('quiz-selection');
  const quizContainer = document.getElementById('quiz-container');
  
  if (selectionSection) selectionSection.style.display = 'none';
  if (quizContainer) quizContainer.style.display = 'block';
  
  renderQuiz();
  window.scrollTo(0, 0);
}

function renderQuiz() {
  const titleEl = document.getElementById('quiz-title');
  const questionsContainer = document.getElementById('questions-container');
  
  if (titleEl) titleEl.textContent = currentQuiz.title;
  if (questionsContainer) {
    questionsContainer.innerHTML = '';
    
    currentQuiz.questions.forEach((q, index) => {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'question';
      
      let optionsHTML = '';
      q.options.forEach((option, optIndex) => {
        optionsHTML += `
          <label class="option">
            <input type="radio" name="q${index}" value="${optIndex}" 
                   onchange="userAnswers[${index}] = ${optIndex}; updateProgress()">
            ${option}
          </label>
        `;
      });
      
      questionDiv.innerHTML = `
        <h4>${index + 1}. ${q.question}</h4>
        ${optionsHTML}
      `;
      
      questionsContainer.appendChild(questionDiv);
    });
  }
  
  updateProgress();
}

function updateProgress() {
  const totalQuestions = currentQuiz.questions.length;
  const answeredQuestions = Object.keys(userAnswers).length;
  const percentage = (answeredQuestions / totalQuestions) * 100;
  
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('quiz-progress');
  
  if (progressFill) progressFill.style.width = percentage + '%';
  if (progressText) progressText.textContent = `${answeredQuestions} מתוך ${totalQuestions} הושלמו`;
}

function goBackToSelection() {
  const selectionSection = document.getElementById('quiz-selection');
  const quizContainer = document.getElementById('quiz-container');
  const resultsContainer = document.getElementById('results-container');
  
  if (selectionSection) selectionSection.style.display = 'block';
  if (quizContainer) quizContainer.style.display = 'none';
  if (resultsContainer) resultsContainer.style.display = 'none';
  
  currentQuiz = null;
  userAnswers = {};
  startTime = null;
  
  window.scrollTo(0, 0);
}

// Handle quiz submission
const quizForm = document.getElementById('quiz-form');
if (quizForm) {
  quizForm.addEventListener('submit', function(e) {
    e.preventDefault();
    submitQuiz();
  });
}

function submitQuiz() {
  if (currentQuiz.questions.length === 0) return;
  
  // Calculate score
  let correctCount = 0;
  const totalCount = currentQuiz.questions.length;
  
  currentQuiz.questions.forEach((q, index) => {
    if (userAnswers[index] === q.correct) {
      correctCount++;
    }
  });
  
  const percentage = (correctCount / totalCount) * 100;
  const endTime = new Date();
  const timeTaken = Math.round((endTime - startTime) / 60000);
  
  showResults(correctCount, totalCount, percentage, timeTaken);
}

function showResults(correctCount, totalCount, percentage, timeTaken) {
  const quizContainer = document.getElementById('quiz-container');
  const resultsContainer = document.getElementById('results-container');
  
  if (quizContainer) quizContainer.style.display = 'none';
  if (resultsContainer) resultsContainer.style.display = 'block';
  
  // Update score circle
  const scorePercentage = document.getElementById('score-percentage');
  if (scorePercentage) scorePercentage.textContent = Math.round(percentage) + '%';
  
  // Update counts
  document.getElementById('correct-count').textContent = correctCount;
  document.getElementById('total-count').textContent = totalCount;
  document.getElementById('time-taken').textContent = timeTaken;
  
  // Performance message
  let performanceMessage = '';
  if (percentage >= 90) {
    performanceMessage = '🎉 מצוין! שליטה גבוהה בחומר!';
  } else if (percentage >= 80) {
    performanceMessage = '👏 כל הכבוד! הבנה טובה מאוד!';
  } else if (percentage >= 70) {
    performanceMessage = '📚 טוב! חזרו על החומר וחזקו נקודות חלשות.';
  } else if (percentage >= 60) {
    performanceMessage = '💪 אתם בדרך הנכונה! המשיכו לתרגל.';
  } else {
    performanceMessage = '📖 כדאי לחזור על הפרקים ולתרגל שוב.';
  }
  
  document.getElementById('performance-message').textContent = performanceMessage;
  
  // Show detailed results
  showDetailedResults();
  
  window.scrollTo(0, 0);
}

function showDetailedResults() {
  const detailedResultsContainer = document.getElementById('detailed-results-container');
  if (!detailedResultsContainer) return;
  
  detailedResultsContainer.innerHTML = '<h3>פירוט תשובות</h3>';
  
  currentQuiz.questions.forEach((q, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer === q.correct;
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'card';
    
    const statusClass = isCorrect ? 'correct' : 'incorrect';
    const statusIcon = isCorrect ? '✓' : '✗';
    
    let resultHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 1.3em; margin-left: 10px; color: ${isCorrect ? '#27ae60' : '#e74c3c'};">${statusIcon}</span>
        <h4 style="margin: 0;">${index + 1}. ${q.question}</h4>
      </div>
    `;
    
    if (!isCorrect) {
      resultHTML += `<p><strong>התשובה שלך:</strong> ${q.options[userAnswer] || 'לא נענתה'}</p>`;
    }
    
    resultHTML += `<p><strong>תשובה נכונה:</strong> ${q.options[q.correct]}</p>`;
    resultHTML += `<p style="color: #666;"><em>${q.explanation}</em></p>`;
    
    resultDiv.innerHTML = resultHTML;
    detailedResultsContainer.appendChild(resultDiv);
  });
}

// Create practice exam from all quizzes
function createPracticeExam() {
  const allQuestions = [];
  const quizIds = ['rise-of-nazism', 'early-war', 'global-conflict', 'holocaust-end'];
  
  quizIds.forEach(id => {
    allQuestions.push(...quizzes[id].questions);
  });
  
  quizzes['practice-exam'] = {
    title: 'מבחן תרגול מלא - מלחמת העולם והשואה',
    description: '50 שאלות מקיפות',
    questions: allQuestions.slice(0, 50)
  };
}

// Styles for results
const style = document.createElement('style');
style.textContent = `
  .results-summary {
    display: flex;
    gap: 30px;
    margin: 30px 0;
    padding: 20px;
    background-color: #f5f5f5;
    border-radius: 8px;
    align-items: center;
  }
  
  .score-circle {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a472a 0%, #2d5f3f 100%);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 2em;
    font-weight: bold;
    flex-shrink: 0;
  }
  
  .score-number {
    font-size: 2.5em;
    margin-bottom: 5px;
  }
  
  .results-details {
    flex: 1;
  }
  
  .results-details p {
    margin: 10px 0;
    font-size: 1.1em;
  }
  
  .quiz-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
  }
  
  .quiz-card {
    background: white;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .quiz-card:hover {
    border-color: #d4a574;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-3px);
  }
  
  .quiz-card h3 {
    margin-top: 0;
    color: #1a472a;
  }
  
  .quiz-card p {
    color: #666;
    margin: 5px 0;
  }
  
  .difficulty {
    display: inline-block;
    padding: 5px 10px;
    background-color: #e8f4f8;
    border-radius: 4px;
    font-size: 0.9em;
    color: #1a472a;
    margin: 10px 0;
    font-weight: bold;
  }
  
  .quiz-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  @media (max-width: 768px) {
    .results-summary {
      flex-direction: column;
      text-align: center;
    }
    
    .score-circle {
      width: 120px;
      height: 120px;
    }
  }
`;
document.head.appendChild(style);
