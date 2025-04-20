
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const distanceMatrix = [
  [0, 10, 15, 20],
  [5, 0, 9, 10],
  [6, 13, 0, 12],
  [8, 8, 9, 0]
];

const cityPositions = [
  [100, 100],
  [400, 100],
  [400, 300],
  [100, 300]
];

const cityNames = ["1", "2", "3", "4"];
const cityColors = ["#f7d794", "#f7d794", "#f7d794", "#f7d794"]; 

let dp = {}, parent = {}, steps = [], stepIndex = 0;

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  document.getElementById(pageId).classList.add('active');
  document.querySelector(`.nav-item[onclick="showPage('${pageId}')"]`).classList.add('active');
  
  if (pageId === 'visualization') {
    showMatrix();
    if (steps.length === 0) {
      tsp(4);
    }
    drawGraph();
  }
}

function drawArrow(fromX, fromY, toX, toY, color = '#f39c12', lineWidth = 3) {
  const headLen = 15;  
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  const circleRadius = 20;
  
  const actualToX = toX - Math.cos(angle) * circleRadius;
  const actualToY = toY - Math.sin(angle) * circleRadius;
  
  const actualFromX = fromX + Math.cos(angle) * circleRadius;
  const actualFromY = fromY + Math.sin(angle) * circleRadius;
  
  ctx.beginPath();
  ctx.moveTo(actualFromX, actualFromY);
  ctx.lineTo(actualToX, actualToY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(actualToX, actualToY);
  ctx.lineTo(
    actualToX - headLen * Math.cos(angle - Math.PI/6),
    actualToY - headLen * Math.sin(angle - Math.PI/6)
  );
  ctx.lineTo(
    actualToX - headLen * Math.cos(angle + Math.PI/6),
    actualToY - headLen * Math.sin(angle + Math.PI/6)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawGraph(highlight = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = '#f0e8d8';
  ctx.lineWidth = 1;
  for (let i = 0; i <= canvas.width; i += 50) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
  
  for (let i = 0; i < cityPositions.length; i++) {
    for (let j = 0; j < cityPositions.length; j++) {
      if (i !== j) {
        const [x1, y1] = cityPositions[i];
        const [x2, y2] = cityPositions[j];
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        ctx.fillStyle = 'rgba(150, 120, 40, 0.3)';
        ctx.font = '12px "Roboto Mono", monospace';
        ctx.fillText(distanceMatrix[i][j], midX, midY);
      }
    }
  }
  
  highlight.forEach(pair => {
    const [i, j] = pair.split('-').map(Number);
    const [x1, y1] = cityPositions[i];
    const [x2, y2] = cityPositions[j];
    drawArrow(x1, y1, x2, y2, '#f39c12', 3);
    
    const midX = (x1 + x2) / 2 + 5;
    const midY = (y1 + y2) / 2 - 5;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px "Roboto Mono", monospace';
    ctx.fillText(distanceMatrix[i][j], midX, midY);
  });
  
  cityPositions.forEach(([x, y], i) => {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = cityColors[i];
    ctx.fill();
    ctx.strokeStyle = "#d35400";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = "#000";
    ctx.font = "bold 16px 'Roboto Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cityNames[i], x, y);
  });
  
  ctx.lineWidth = 1;
}

function showMatrix() {
  const div = document.getElementById("matrix");
  let html = "<table><tr><th></th>";
  for (let i = 0; i < 4; i++) html += `<th>${i + 1}</th>`;
  html += "</tr>";
  for (let i = 0; i < 4; i++) {
    html += `<tr><th>${i + 1}</th>`;
    for (let j = 0; j < 4; j++) {
      html += `<td>${distanceMatrix[i][j]}</td>`;
    }
    html += "</tr>";
  }
  html += "</table>";
  div.innerHTML = html;
}

function tsp(n) {
  const cities = Array.from({ length: n }, (_, i) => i);
  const subsets = generateSubsets(n, 1);

  for (let i = 1; i < n; i++) {
    const key = `${i}|`;
    dp[key] = distanceMatrix[i][0];
    steps.push({
      type: 'base',
      notation: `g(${i+1}, ∅) = C[${i+1}][1] = ${distanceMatrix[i][0]}`,
      highlight: [`${i}-0`]
    });
  }

  for (let size = 1; size < n; size++) {
    for (let subset of subsets[size]) {
      for (let i = 1; i < n; i++) {
        if (subset.includes(i)) continue;
        
        const key = `${i}|${subset.join(',')}`;
        let minCost = Infinity, chosenJ = -1, highlight = [];

        for (let j of subset) {
          const reducedSet = subset.filter(x => x !== j);
          const subKey = `${j}|${reducedSet.join(',')}`;
          const cost = distanceMatrix[i][j] + (dp[subKey] || 0);
          
          steps.push({
            type: 'step',
            notation: `g(${i+1}, {${subset.map(x => x+1)}}) try j=${j+1} → C[${i+1}][${j+1}] + g(${j+1}, {${reducedSet.map(x => x+1)}}) = ${distanceMatrix[i][j]} + ${dp[subKey]} = ${cost}`,
            highlight: [`${i}-${j}`, ...reducedSet.length > 0 ? [`${j}-${reducedSet[0]}`] : []]
          });

          if (cost < minCost) {
            minCost = cost;
            chosenJ = j;
          }
        }

        dp[key] = minCost;
        parent[key] = chosenJ;
        
        steps.push({
          type: 'chosen',
          notation: `✅ g(${i+1}, {${subset.map(x => x+1)}}) = ${minCost} (via j=${chosenJ+1})`,
          highlight: [`${i}-${chosenJ}`]
        });
      }
    }
  }

  const fullSet = cities.slice(1);
  let minTour = Infinity, lastCity = -1;
  
  for (let j of fullSet) {
    const key = `${j}|${fullSet.filter(x => x !== j).join(',')}`;
    const tourCost = distanceMatrix[0][j] + dp[key];
    
    steps.push({
      type: 'final',
      notation: `Try full tour via ${j+1}: C[1][${j+1}] + g(${j+1}, {${fullSet.filter(x => x !== j).map(x => x+1)}}) = ${distanceMatrix[0][j]} + ${dp[key]} = ${tourCost}`,
      highlight: [`0-${j}`]
    });

    if (tourCost < minTour) {
      minTour = tourCost;
      lastCity = j;
    }
  }

  steps.push({ 
    type: 'done',
    notation: `✅ Minimum tour cost = ${minTour}`,
    highlight: []
  });
  
  const fullPath = reconstructPath(lastCity, fullSet);
  fullPath.unshift(0); 
  fullPath.push(0);   
  
  const pathStr = fullPath.map(c => c+1).join(' → ');
  
  const pathHighlights = [];
  for (let i = 0; i < fullPath.length - 1; i++) {
    pathHighlights.push(`${fullPath[i]}-${fullPath[i+1]}`);
  }
  
  steps.push({ 
    type: 'path',
    notation: `Optimal Path: ${pathStr}`,
    highlight: pathHighlights
  });
}

function reconstructPath(lastCity, fullSet) {
  const path = [];
  let currentCity = lastCity;
  let remainingCities = [...fullSet].filter(c => c !== lastCity);
  
  path.push(lastCity);
  
  while (remainingCities.length > 0) {
    const key = `${currentCity}|${remainingCities.join(',')}`;
    const nextCity = parent[key];
    
    if (nextCity === undefined) break;
    
    path.push(nextCity);
    currentCity = nextCity;
    remainingCities = remainingCities.filter(c => c !== nextCity);
  }
  
  return path.reverse(); 
}

function generateSubsets(n, minSize = 1) {
  const subsets = Array.from({ length: n }, () => []);
  const arr = Array.from({ length: n - 1 }, (_, i) => i + 1);
  const total = 1 << arr.length;

  for (let mask = 0; mask < total; mask++) {
    const subset = [];
    for (let i = 0; i < arr.length; i++) {
      if ((mask >> i) & 1) subset.push(arr[i]);
    }
    if (subset.length >= minSize) {
      subsets[subset.length].push(subset);
    }
  }
  return subsets;
}

function nextStep() {
  if (stepIndex >= steps.length) return;
  
  const log = document.getElementById("log");
  const msg = document.createElement("div");
  const step = steps[stepIndex++];

  msg.textContent = step.notation;
  msg.className = step.type;
  
  log.appendChild(msg);
  log.scrollTop = log.scrollHeight;

  drawGraph(step.highlight || []);
}

function runAllSteps() {
  stepIndex = 0;
  document.getElementById('log').innerHTML = '';
  
  function executeNextStep() {
    if (stepIndex < steps.length) {
      nextStep();
      setTimeout(executeNextStep, 300);
    }
  }
  
  executeNextStep();
}

window.onload = function() {
  showPage('explanation');
};