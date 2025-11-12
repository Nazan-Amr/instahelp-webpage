// Minimal reproduction of EmergencyPage.tsx behavior in plain JS
// - Renders demo/mock data
// - Attempts to fetch from /api/emergency/:token if available
// - Geolocates user and shows Leaflet map + Overpass nearby hospitals

(function(){
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

  // Helpers
  function el(id){return document.getElementById(id)}
  function q(sel){return document.querySelector(sel)}

  // Determine token from URL like /r/TOKEN or query param token
  function getToken(){
    try{
      const p = location.pathname.split('/').filter(Boolean);
      const rIndex = p.indexOf('r');
      if(rIndex!==-1 && p[rIndex+1]) return p[rIndex+1];
      const q = new URLSearchParams(location.search);
      return q.get('token') || null;
    }catch(e){return null}
  }

  // Attempt to fetch a real API (if the project backend exists), otherwise use demo
  async function fetchEmergencyView(token){
    if(!token) return { public_view: demo, is_authenticated: false };
    const url = `/api/emergency/${token}`; // try common route first
    try{
      const resp = await fetch(url);
      if(!resp.ok) throw new Error('non-OK');
      const data = await resp.json();
      // If server returns the full structure already
      if(data && data.public_view) return data;
      return { public_view: data, is_authenticated: false };
    }catch(e){
      // fallback: return demo
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
      public_view.allergies.forEach((a,i)=>{
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
      const lv = el('last-vitals'); lv.innerHTML = '';
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

  // Leaflet map + Overpass
  let map, myMarker;
  async function initMapAndHospitals(){
    if(!('geolocation' in navigator)) {
      console.warn('No geolocation');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const lat = pos.coords.latitude; const lng = pos.coords.longitude;
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
        const list = el('hospital-list'); list.innerHTML = '';
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

    // Refresh button
    el('refresh-btn').addEventListener('click', async ()=>{
      el('refresh-btn').textContent = 'Refreshing...';
      try{
        const r = await fetchEmergencyView(token);
        renderPublicView(r.public_view || demo);
      }finally{el('refresh-btn').textContent = '🔄 Refresh'}
    });

    // Login button (simple redirect)
    el('login-btn').addEventListener('click', ()=>{
      const redirect = `/r/${token||''}`;
      location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
    });

    // Full record toggle for demo purposes (press 'f' to toggle)
    document.addEventListener('keydown',(e)=>{
      if(e.key==='f'){
        const full = el('full-record');
        if(full.style.display==='none'){
          full.style.display = 'block';
          el('full-record-content').innerHTML = `<pre>${JSON.stringify({private_profile:{full_name:'Demo Person',national_id:'1234',date_of_birth:'1990-01-01',doctor_notes:'No extra notes'},medications:[],chronic_conditions:[],surgeries:[],immunizations:[]},null,2)}</pre>`;
        } else { full.style.display='none'; }
      }
    });

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
    `;
    document.head.appendChild(style);
  });

  // Run
  init();
})();
