// Minimal reproduction of EmergencyPage.tsx behavior in plain JS
// - Renders demo/mock data
// - Attempts to fetch from /api/emergency/:token if available
// - Geolocates user and shows Leaflet map + Overpass nearby hospitals
// - Includes login modal with authentication and session persistence

(function(){
  // Valid credentials
  const VALID_EMAIL = 'Doctor@instahelp.example.com';
  const VALID_PASSWORD = 'Doctor123!';

  // Patient medical history data - Omar H. Saleh
  const patientMedicalHistory = {
    name: 'Omar H. Saleh',
    age: 42,
    sex: 'Male',
    nationality: 'Egyptian',
    occupation: 'High-school physics teacher',
    maritalStatus: 'Married, two children',
    dateOfSummary: '04 December 2025',
    
    chiefComplaint: 'Persistent fatigue, shortness of breath on exertion, and occasional tightness in the chest for the past six months.',
    
    historyOfPresentIllness: 'Omar reports a gradually worsening fatigue that began approximately six months ago. At first, he attributed it to workload and stress, but the symptoms slowly expanded. He now experiences dyspnea when climbing stairs, intermittent dull chest pressure, and occasional lightheadedness, especially in the mornings. Symptoms are not triggered by food, position, or temperature. He denies any episodes of syncope, palpitations, fever, cough, or recent infections. No leg swelling or sudden weight changes. Sleep is fragmented—he wakes up multiple times at night, "as if gasping for air." He describes increasing emotional strain. Symptoms worsen during exam seasons and improve slightly on weekends.',
    
    pastMedicalHistory: [
      { condition: 'Hypertension', age: 36, details: 'Previously controlled with medication but poorly controlled over the last year' },
      { condition: 'Dyslipidemia', age: 39, details: 'Elevated LDL, low HDL' },
      { condition: 'Childhood Asthma', age: 'Childhood', details: 'Resolved by adulthood with no recent exacerbations' },
      { condition: 'Gastritis', age: 32, details: 'Following H. pylori infection; treated successfully' },
      { condition: 'COVID-19', age: 2021, details: 'Mild infection; full recovery' }
    ],

    pastSurgicalHistory: [
      { procedure: 'Appendectomy (laparoscopic)', age: 27 },
      { procedure: 'Nasal septum deviation repair', age: 34 }
    ],

    medications: [
      { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily' },
      { name: 'Atorvastatin', dosage: '20 mg', frequency: 'At night' },
      { name: 'Omeprazole', dosage: '20 mg', frequency: 'PRN for gastritis' },
      { name: 'Multivitamin', dosage: 'OTC', frequency: 'Daily' }
    ],

    allergies: [
      { allergen: 'Penicillin', reaction: 'Rash and itching', severity: 'severe' }
    ],

    familyHistory: [
      { relative: 'Father', condition: 'Myocardial infarction at age 58; hypertension' },
      { relative: 'Mother', condition: 'Type 2 diabetes mellitus' },
      { relative: 'Sister', condition: 'Hypothyroidism' }
    ],

    socialHistory: {
      smoking: 'Non-smoker',
      alcohol: 'No alcohol consumption',
      caffeine: 'Heavy coffee drinker (4-5 cups/day)',
      exercise: 'Sedentary lifestyle; minimal exercise despite teaching physics',
      diet: 'High in carbohydrates, low in vegetables; frequently skips breakfast',
      stress: 'High work-related stress, especially during exam periods',
      sleep: '4-5 hours/night on average'
    },

    physicalExamination: {
      vitals: {
        BP: '148/92 mmHg',
        HR: '86 bpm',
        RR: '18/min',
        Temp: '36.8°C',
        SpO2: '97% on room air',
        BMI: '29.2 (overweight)'
      },
      general: 'Alert, tired-appearing male',
      cardiac: 'Regular rhythm; slight S4; no murmurs',
      respiratory: 'Clear bilaterally',
      abdomen: 'Soft, non-tender',
      extremities: 'No edema; peripheral pulses intact',
      neuro: 'No focal deficits'
    },

    labResults: [
      { test: 'CBC', result: 'WNL' },
      { test: 'CMP', result: 'WNL except mild ALT elevation (48 U/L)' },
      { test: 'LDL Cholesterol', result: '167 mg/dL (high)' },
      { test: 'HDL Cholesterol', result: '37 mg/dL (low)' },
      { test: 'Triglycerides', result: '202 mg/dL (high)' },
      { test: 'TSH', result: 'Normal' },
      { test: 'HbA1c', result: '5.4%' },
      { test: 'CRP', result: 'Mild elevation (5 mg/L)' }
    ],

    imaging: [
      { test: 'ECG', result: 'Normal sinus rhythm; LVH borderline signs' },
      { test: 'Echocardiogram', result: 'Mild left ventricular hypertrophy; EF 60%' },
      { test: 'Sleep Study', result: 'Suspicion of obstructive sleep apnea due to nocturnal gasping and daytime fatigue (study pending)' },
      { test: 'Chest X-ray', result: 'Normal' }
    ],

    assessment: 'Omar is a 42-year-old male with poorly controlled hypertension, dyslipidemia, work-induced stress, and likely early obstructive sleep apnea. His symptoms are most consistent with: Early hypertensive heart disease, Work-related fatigue and stress, Insomnia with possible OSA, and Borderline metabolic markers related to lifestyle.',

    plan: [
      'Increase Amlodipine to 10 mg daily',
      'Reinforce statin adherence',
      'Order sleep study to evaluate for OSA',
      'Begin daily 20-minute walking routine',
      'Nutrition referral: reduce refined carbohydrates, increase vegetables',
      'Stress-management counseling',
      'Follow-up in 6 weeks; repeat lipid panel in 3 months'
    ]
  };

  // Demo data fallback (structure similar to EmergencyView.public_view)
  const demo = {
    blood_type: 'A',
    rh_factor: '+',
    emergency_contact: { name: 'John Doe', relationship: 'Brother', phone: '+201206593899' },
    allergies: [ { allergen: 'Peanuts', reaction: 'Anaphylaxis', severity: 'critical' }, { allergen: 'Penicillin', reaction: 'Rash', severity: 'severe' } ],
    short_instructions: 'I am asthmatic. Always keep my inhaler nearby. In case of attack, use Ventolin Inhaler.\n Do not give me any medication containing penicillin.\nContact my father immediately and take me to nearest hospital.\n If I appear to have difficulty breathing or wheezing, assume it is an asthma attack. Please:\n 1- Assist me in sitting upright and provide access to my Ventolin inhaler (usually kept in my backpack).\n2- Administer two puffs, and wait for response. If no improvement within 10 minutes, administer two more puffs.\n3- If breathing does not stabilize, call emergency services (123 in Egypt) immediately and transport me to the nearest hospital.',
    last_vitals: { heart_rate: 88, temperature: 37.2, blood_pressure_systolic: 130, blood_pressure_diastolic: 85, oxygen_saturation: 96, respiratory_rate: 18, timestamp: new Date().toISOString() },
    vital_ranges: { heart_rate_min: 60, heart_rate_max: 100, temperature_min: 36.1, temperature_max: 37.2, blood_pressure_systolic: 120, blood_pressure_diastolic: 80 }
  };

  // State
  let isAuthenticated = false;
  let publicViewVisible = true;

  // Helpers
  function el(id){return document.getElementById(id)}
  function q(sel){return document.querySelector(sel)}

  // Session Management
  function saveSession(){
    try{
      sessionStorage.setItem('medicalAuth', 'true');
    }catch(e){
      console.warn('SessionStorage unavailable', e);
    }
  }

  function loadSession(){
    try{
      return sessionStorage.getItem('medicalAuth') === 'true';
    }catch(e){
      console.warn('SessionStorage unavailable', e);
      return false;
    }
  }

  function clearSession(){
    try{
      sessionStorage.removeItem('medicalAuth');
    }catch(e){
      console.warn('SessionStorage unavailable', e);
    }
  }

  // Determine token from URL like /r/TOKEN or query param token
  function getToken(){
    try{
      const p = location.pathname.split('/').filter(Boolean);
      const rIndex = p.indexOf('r');
      if(rIndex!==-1 && p[rIndex+1]) return p[rIndex+1];
      const qs = new URLSearchParams(location.search);
      return qs.get('token') || null;
    }catch(e){return null}
  }

  // Attempt to fetch a real API (if the project backend exists), otherwise use demo
  async function fetchEmergencyView(token){
    if(!token) return { public_view: demo, is_authenticated: false };
    const url = `/api/emergency/${token}`;
    try{
      const resp = await fetch(url);
      if(!resp.ok) throw new Error('non-OK');
      const data = await resp.json();
      if(data && data.public_view) return data;
      return { public_view: data, is_authenticated: false };
    }catch(e){
      console.warn('API fetch failed, using demo data', e);
      return { public_view: demo, is_authenticated: false };
    }
  }

  function severityBadge(sev){
    const s = (sev||'unknown').toLowerCase();
    if(s==='critical') return 'badge red';
    if(s==='severe') return 'badge orange';
    if(s==='moderate') return 'badge yellow';
    if(s==='mild') return 'badge green';
    return 'badge gray';
  }

  function renderPublicView(public_view){
    // Blood type
    el('blood-type').textContent = (public_view.blood_type || '--') + (public_view.rh_factor || '');

    // Allergies
    const allergiesList = el('allergies-list');
    allergiesList.innerHTML = '';
    if(public_view.allergies && public_view.allergies.length){
      const wrap = document.createElement('div');
      wrap.className = 'allergy-wrap';
      public_view.allergies.forEach((a)=>{
        const span = document.createElement('span');
        span.className = severityBadge(a.severity);
        span.title = (a.reaction||'No reaction provided');
        span.textContent = `${a.allergen || 'Unknown'} (${(a.severity||'U').charAt(0).toUpperCase()})`;
        wrap.appendChild(span);
      });
      allergiesList.appendChild(wrap);
    } else {
      allergiesList.textContent = 'None reported';
    }

    // Contact
    el('contact-name').textContent = public_view.emergency_contact?.name || '--';
    el('contact-relationship').textContent = public_view.emergency_contact?.relationship || '';
    el('contact-phone').textContent = public_view.emergency_contact?.phone || '--';

    // Call buttons
    const callActions = el('call-actions');
    callActions.innerHTML = '';
    if(public_view.emergency_contact?.phone){
      const a = document.createElement('a');
      a.href = `tel:${public_view.emergency_contact.phone}`;
      a.className = 'btn primary';
      a.textContent = `📞 CALL ${public_view.emergency_contact.phone}`;
      callActions.appendChild(a);

      const callNow = document.createElement('a');
      callNow.href = `tel:${public_view.emergency_contact.phone}`;
      callNow.className = 'btn primary';
      callNow.textContent = '📞 CALL NOW';
      el('call-now').appendChild(callNow);
    }

    // Instructions
    el('short-instructions').textContent = public_view.short_instructions || '';

    // Last vitals
    if(public_view.last_vitals){
      el('last-vitals-card').style.display = 'block';
      const lv = el('last-vitals');
      lv.innerHTML = '';
      const lvData = public_view.last_vitals;
      const addTile = (label, value, unit)=>{
        const d = document.createElement('div');
        d.innerHTML = `<div class="muted">${label}</div><div class="big">${value}</div><div class="muted">${unit||''}</div>`;
        lv.appendChild(d);
      };
      if(lvData.heart_rate) addTile('Heart Rate', lvData.heart_rate, 'bpm');
      if(lvData.temperature) addTile('Temperature', lvData.temperature, '°C');
      if(lvData.blood_pressure_systolic) addTile('Blood Pressure', `${lvData.blood_pressure_systolic}/${lvData.blood_pressure_diastolic}`, 'mmHg');
      if(lvData.oxygen_saturation) addTile('O₂ Saturation', lvData.oxygen_saturation, '%');
      if(lvData.respiratory_rate) addTile('Respiratory Rate', lvData.respiratory_rate, 'breaths/min');

      const lastUpdated = document.createElement('div');
      lastUpdated.className = 'muted';
      lastUpdated.style.marginTop = '8px';
      lastUpdated.textContent = `Last Updated: ${new Date(lvData.timestamp||Date.now()).toLocaleString()}`;
      lv.appendChild(lastUpdated);
    }
  }

  function renderMedicalHistory(){
    const content = el('full-record-content');
    content.innerHTML = '';

    // Patient Demographics
    const demoDiv = document.createElement('div');
    demoDiv.className = 'record-section';
    demoDiv.innerHTML = `<h3>👤 Patient Information</h3>`;
    const demoItems = [
      { label: 'Full Name', value: patientMedicalHistory.name },
      { label: 'Age', value: patientMedicalHistory.age },
      { label: 'Sex', value: patientMedicalHistory.sex },
      { label: 'Nationality', value: patientMedicalHistory.nationality },
      { label: 'Occupation', value: patientMedicalHistory.occupation },
      { label: 'Marital Status', value: patientMedicalHistory.maritalStatus },
      { label: 'Date of Summary', value: patientMedicalHistory.dateOfSummary }
    ];
    demoItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-label">${item.label}</div><div class="record-value">${item.value}</div>`;
      demoDiv.appendChild(itemDiv);
    });
    content.appendChild(demoDiv);

    // Chief Complaint
    const ccDiv = document.createElement('div');
    ccDiv.className = 'record-section';
    ccDiv.innerHTML = `<h3>⚠️ Chief Complaint</h3><div class="record-item"><div class="record-value">${patientMedicalHistory.chiefComplaint}</div></div>`;
    content.appendChild(ccDiv);

    // History of Present Illness
    const hpiDiv = document.createElement('div');
    hpiDiv.className = 'record-section';
    hpiDiv.innerHTML = `<h3>📋 History of Present Illness</h3><div class="record-item"><div class="record-value">${patientMedicalHistory.historyOfPresentIllness}</div></div>`;
    content.appendChild(hpiDiv);

    // Past Medical History
    const pmhDiv = document.createElement('div');
    pmhDiv.className = 'record-section';
    pmhDiv.innerHTML = `<h3>🏥 Past Medical History</h3>`;
    patientMedicalHistory.pastMedicalHistory.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-label">${item.condition} (Age ${item.age})</div><div class="record-value">${item.details}</div>`;
      pmhDiv.appendChild(itemDiv);
    });
    content.appendChild(pmhDiv);

    // Past Surgical History
    const pshDiv = document.createElement('div');
    pshDiv.className = 'record-section';
    pshDiv.innerHTML = `<h3>🔪 Past Surgical History</h3>`;
    patientMedicalHistory.pastSurgicalHistory.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-label">${item.procedure}</div><div class="record-value">Age: ${item.age}</div>`;
      pshDiv.appendChild(itemDiv);
    });
    content.appendChild(pshDiv);

    // Medications
    const medDiv = document.createElement('div');
    medDiv.className = 'record-section';
    medDiv.innerHTML = `<h3>💊 Current Medications</h3>`;
    patientMedicalHistory.medications.forEach(med => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-label">${med.name}</div><div class="record-value">${med.dosage} - ${med.frequency}</div>`;
      medDiv.appendChild(itemDiv);
    });
    content.appendChild(medDiv);

    // Allergies
    const allergyDiv = document.createElement('div');
    allergyDiv.className = 'record-section';
    allergyDiv.innerHTML = `<h3>⚠️ Allergies</h3>`;
    patientMedicalHistory.allergies.forEach(allergy => {
      const span = document.createElement('span');
      span.className = severityBadge(allergy.severity);
      span.textContent = `${allergy.allergen}: ${allergy.reaction}`;
      span.style.marginBottom = '8px';
      allergyDiv.appendChild(span);
    });
    content.appendChild(allergyDiv);

    // Family History
    const famDiv = document.createElement('div');
    famDiv.className = 'record-section';
    famDiv.innerHTML = `<h3>👨‍👩‍👧‍👦 Family History</h3>`;
    patientMedicalHistory.familyHistory.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-label">${item.relative}</div><div class="record-value">${item.condition}</div>`;
      famDiv.appendChild(itemDiv);
    });
    content.appendChild(famDiv);

    // Social History
    const socDiv = document.createElement('div');
    socDiv.className = 'record-section';
    socDiv.innerHTML = `<h3>🏘️ Social History</h3>`;
    const socItems = [
      { label: 'Smoking', value: patientMedicalHistory.socialHistory.smoking },
      { label: 'Alcohol', value: patientMedicalHistory.socialHistory.alcohol },
      { label: 'Caffeine', value: patientMedicalHistory.socialHistory.caffeine },
      { label: 'Exercise', value: patientMedicalHistory.socialHistory.exercise },
      { label: 'Diet', value: patientMedicalHistory.socialHistory.diet },
      { label: 'Stress Level', value: patientMedicalHistory.socialHistory.stress },
      { label: 'Sleep', value: patientMedicalHistory.socialHistory.sleep }
    ];
    socItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-label">${item.label}</div><div class="record-value">${item.value}</div>`;
      socDiv.appendChild(itemDiv);
    });
    content.appendChild(socDiv);

    // Physical Examination
    const peDiv = document.createElement('div');
    peDiv.className = 'record-section';
    peDiv.innerHTML = `<h3>🩺 Physical Examination</h3>`;
    
    const vitalsSubDiv = document.createElement('div');
    vitalsSubDiv.style.marginBottom = '12px';
    vitalsSubDiv.innerHTML = `<div class="record-label" style="margin-bottom: 8px;">Vital Signs</div>`;
    Object.entries(patientMedicalHistory.physicalExamination.vitals).forEach(([key, value]) => {
      const span = document.createElement('div');
      span.style.color = 'var(--muted)';
      span.style.marginBottom = '4px';
      span.textContent = `${key}: ${value}`;
      vitalsSubDiv.appendChild(span);
    });
    peDiv.appendChild(vitalsSubDiv);

    const examItems = [
      { label: 'General', value: patientMedicalHistory.physicalExamination.general },
      { label: 'Cardiac', value: patientMedicalHistory.physicalExamination.cardiac },
      { label: 'Respiratory', value: patientMedicalHistory.physicalExamination.respiratory },
      { label: 'Abdomen', value: patientMedicalHistory.physicalExamination.abdomen },
      { label: 'Extremities', value: patientMedicalHistory.physicalExamination.extremities },
      { label: 'Neuro', value: patientMedicalHistory.physicalExamination.neuro }
    ];
    examItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-label">${item.label}</div><div class="record-value">${item.value}</div>`;
      peDiv.appendChild(itemDiv);
    });
    content.appendChild(peDiv);

    // Laboratory Results
    const labDiv = document.createElement('div');
    labDiv.className = 'record-section';
    labDiv.innerHTML = `<h3>🧪 Laboratory Results</h3>`;
    patientMedicalHistory.labResults.forEach(lab => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-label">${lab.test}</div><div class="record-value">${lab.result}</div>`;
      labDiv.appendChild(itemDiv);
    });
    content.appendChild(labDiv);

    // Imaging & Tests
    const imgDiv = document.createElement('div');
    imgDiv.className = 'record-section';
    imgDiv.innerHTML = `<h3>🖼️ Imaging & Tests</h3>`;
    patientMedicalHistory.imaging.forEach(img => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-label">${img.test}</div><div class="record-value">${img.result}</div>`;
      imgDiv.appendChild(itemDiv);
    });
    content.appendChild(imgDiv);

    // Assessment
    const assDiv = document.createElement('div');
    assDiv.className = 'record-section';
    assDiv.innerHTML = `<h3>📊 Assessment</h3><div class="record-item"><div class="record-value">${patientMedicalHistory.assessment}</div></div>`;
    content.appendChild(assDiv);

    // Plan
    const planDiv = document.createElement('div');
    planDiv.className = 'record-section';
    planDiv.innerHTML = `<h3>📅 Treatment Plan</h3>`;
    patientMedicalHistory.plan.forEach((item, idx) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';
      itemDiv.innerHTML = `<div class="record-value">${idx + 1}. ${item}</div>`;
      planDiv.appendChild(itemDiv);
    });
    content.appendChild(planDiv);
  }

  function switchToAuthenticatedView(){
    publicViewVisible = false;
    el('main-content').style.display = 'none';
    el('authenticated-view').style.display = 'block';
    renderMedicalHistory();
  }

  function switchToPublicView(){
    publicViewVisible = true;
    el('authenticated-view').style.display = 'none';
    el('main-content').style.display = 'flex';
  }

  function showLoginModal(){
    el('login-modal').style.display = 'flex';
  }

  function closeLoginModal(){
    el('login-modal').style.display = 'none';
    el('email').value = '';
    el('password').value = '';
    el('error-message').style.display = 'none';
  }

  function handleLogin(e){
    e.preventDefault();
    const email = el('email').value.trim();
    const password = el('password').value;
    const errorMsg = el('error-message');

    if(email === VALID_EMAIL && password === VALID_PASSWORD){
      isAuthenticated = true;
      saveSession();
      closeLoginModal();
      switchToAuthenticatedView();
      errorMsg.style.display = 'none';
    } else {
      errorMsg.textContent = 'Invalid email or password. Please try again.';
      errorMsg.style.display = 'block';
    }
  }

  function handleLogout(){
    isAuthenticated = false;
    clearSession();
    switchToPublicView();
    el('full-record-content').innerHTML = '';
  }

  // Leaflet map + Overpass
  let map, myMarker;
  async function initMapAndHospitals(){
    if(!('geolocation' in navigator)) {
      console.warn('No geolocation');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      el('hospitals-card').style.display = 'block';

      if(!map){
        map = L.map('map').setView([lat,lng],13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap contributors'}).addTo(map);
        myMarker = L.marker([lat,lng]).addTo(map).bindPopup('Your Location').openPopup();
      } else {
        map.setView([lat,lng],13);
        myMarker.setLatLng([lat,lng]);
      }

      // Fetch nearby hospitals from Overpass
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];(node["amenity"="hospital"](around:5000,${lat},${lng});way["amenity"="hospital"](around:5000,${lat},${lng});relation["amenity"="hospital"](around:5000,${lat},${lng}););out center;`;
      try{
        const r = await fetch(overpassUrl);
        const d = await r.json();
        const els = d.elements||[];
        const list = el('hospital-list');
        list.innerHTML = '';
        let count = 0;
        els.forEach(h=>{
          const latH = h.lat || (h.center && h.center.lat);
          const lonH = h.lon || (h.center && h.center.lon);
          if(latH && lonH){
            L.marker([latH,lonH]).addTo(map).bindPopup(h.tags?.name || 'Hospital');
            const li = document.createElement('li');
            const name = h.tags?.name || 'Hospital';
            li.innerHTML = `<div><strong>${name}</strong>${h.tags?.phone?`<div class="muted">${h.tags.phone}</div>`:''}</div><a class="btn" target="_blank" href="https://www.google.com/maps/search/?api=1&query=${latH},${lonH}">📍 Directions</a>`;
            list.appendChild(li);
            count++;
          }
        });
        if(count===0){
          el('hospital-list').innerHTML = '<li class="muted">No nearby hospitals found (or Overpass API rate-limited).</li>';
        }
      }catch(err){
        console.error('Overpass failed',err);
        el('hospital-list').innerHTML = '<li class="muted">Failed to load nearby hospitals.</li>';
      }
    }, (err)=>{
      console.warn('Geolocation error', err);
    });
  }

  // Init
  async function init(){
    const token = getToken();
    const response = await fetchEmergencyView(token);
    const public_view = response.public_view || demo;
    renderPublicView(public_view);

    // Check if user has active session
    if(loadSession()){
      isAuthenticated = true;
      switchToAuthenticatedView();
    }

    // Refresh button
    el('refresh-btn').addEventListener('click', async ()=>{
      el('refresh-btn').textContent = 'Refreshing...';
      try{
        const r = await fetchEmergencyView(token);
        renderPublicView(r.public_view || demo);
      }finally{el('refresh-btn').textContent = '🔄 Refresh'}
    });

    // Login button
    el('login-btn').addEventListener('click', showLoginModal);

    // Login form submit
    el('login-form').addEventListener('submit', handleLogin);

    // Close modal button
    el('close-modal').addEventListener('click', closeLoginModal);

    // Close modal when clicking outside
    el('login-modal').addEventListener('click', (e)=>{
      if(e.target === el('login-modal')){
        closeLoginModal();
      }
    });

    // Back button
    el('back-btn').addEventListener('click', switchToPublicView);

    // Logout button
    el('logout-btn').addEventListener('click', handleLogout);

    // Map/hospitals
    initMapAndHospitals();
  }

  // Small styles for badges (added via JS so they exist even if CSS hasn't loaded in some contexts)
  document.addEventListener('DOMContentLoaded', ()=>{
    const style = document.createElement('style');
    style.textContent = `
      .badge{display:inline-block;padding:6px 10px;border-radius:999px;margin-right:6px;margin-bottom:6px;font-size:0.85rem}
      .badge.red{background:#fecaca;color:#7f1d1d}
      .badge.orange{background:#fed7aa;color:#7c2d12}
      .badge.yellow{background:#fef3c7;color:#92400e}
      .badge.green{background:#bbf7d0;color:#064e3b}
      .badge.gray{background:#e5e7eb;color:#374151}
      .allergy-wrap{display:flex;flex-wrap:wrap}
    `;
    document.head.appendChild(style);
    init();
  });
})();