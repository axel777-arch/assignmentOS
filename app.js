(() => {
      'use strict';
      const STORAGE_KEY = 'assignmentos-v1';
      const PROFILE_DEFAULTS = { name: 'Student', course: 'Student workspace', theme: 'light' };
      const sampleAssignment = {
        id: 'sample-electrolysis', title: 'Electrolysis and its applications', course: 'Chemistry 201', subject: 'CHEMISTRY · LAB REPORT', due: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10), targetWords: 1350, minWords: 1200, maxWords: 1500, sourceTarget: 4,
        instructions: 'Write a 1,200 to 1,500 word chemistry report on electrolysis. Explain the process, discuss Faraday\'s laws, describe two applications, and use at least four sources.',
        requirements: [
          { id: 'r-topic', text: 'Explain the electrolysis process', type: 'concept', status: 'unchecked' },
          { id: 'r-laws', text: 'Discuss Faraday\'s laws', type: 'concept', status: 'unchecked' },
          { id: 'r-apps', text: 'Describe two applications', type: 'concept', status: 'unchecked' },
          { id: 'r-sources', text: 'Use at least 4 identifiable sources', type: 'sources', status: 'unchecked' },
          { id: 'r-length', text: 'Write between 1,200 and 1,500 words', type: 'length', status: 'unchecked' }
        ], content: '<h2>Electrolysis: an introduction</h2><p>Electrolysis uses an external electrical current to drive a chemical reaction that would not occur spontaneously. In an electrolytic cell, a power supply moves electrons through the circuit while ions carry charge through the electrolyte. Reduction takes place at the cathode and oxidation at the anode.</p><h3>How the process works</h3><p>When a direct current is applied, positively charged ions migrate toward the cathode and gain electrons. Negative ions move toward the anode, where they lose electrons. The products depend on the ions present, electrode material, and operating conditions.</p><h3>Faraday\'s laws</h3><p>The amount of substance produced at an electrode is proportional to the total electric charge passed through the cell. Faraday\'s second law relates the mass produced to its chemical equivalent, making it possible to predict how much material forms during a process.</p><h3>Applications</h3><p>Electroplating deposits a thin metal coating on an object to improve corrosion resistance and appearance. Electrolysis is also used to extract and refine metals, including aluminium, from compounds that are difficult to reduce with carbon.</p><h3>Conclusion</h3><p>Understanding the movement of ions and electrons helps explain why electrolysis remains useful across manufacturing and materials science.</p><h3>References</h3><p>Brown, T. et al. Chemistry: The Central Science. 14th ed.<br>Faraday, M. Experimental Researches in Electricity. 1834.</p>'
      };
      const state = loadState();
      let activeView = 'workspace';
      let toastTimer;
      let lastAnalysis = null;
      let backendAvailable = false;
      let assistantMode = 'local';
      let saveQueue = Promise.resolve();
      let syncTimer;
      const $ = (selector) => document.querySelector(selector);
      const $$ = (selector) => Array.from(document.querySelectorAll(selector));
      const elements = {
        writing: $('#writing-area'), requirements: $('#requirements-list'), search: $('#material-search'), results: $('#search-results'), fileInput: $('#pdf-input'),
        materials: $('#material-list'), toast: $('#toast'), modal: $('#assignment-modal')
      };

      function loadState() {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
          if (saved && Array.isArray(saved.assignments) && saved.assignments.length) return { ...saved, profile: { ...PROFILE_DEFAULTS, ...(saved.profile || {}) } };
        } catch (error) { console.warn('Saved workspace could not be read.', error); }
        return { assignments: [structuredClone(sampleAssignment)], activeId: sampleAssignment.id, materials: [], profile: { ...PROFILE_DEFAULTS } };
      }
      function persist() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          $('#save-indicator').textContent = backendAvailable ? 'SYNCING…' : 'SAVED LOCALLY';
        }
        catch (error) { $('#save-indicator').textContent = 'SAVE UNAVAILABLE'; console.error('Workspace could not be saved.', error); }
        if (!backendAvailable) return;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(syncState, 350);
      }
      function syncState() {
        if (!backendAvailable) return saveQueue;
        const snapshot = JSON.stringify(state);
        saveQueue = saveQueue.catch(() => {}).then(async () => {
          const response = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: snapshot });
          if (!response.ok) throw new Error(`State sync returned HTTP ${response.status}.`);
          $('#save-indicator').textContent = 'SAVED TO SERVER';
        }).catch((error) => {
          backendAvailable = false;
          $('#connection-status').textContent = 'LOCAL MODE';
          $('#save-indicator').textContent = 'SAVED LOCALLY';
          console.warn('Backend sync paused; local saving remains available.', error);
        });
        return saveQueue;
      }
      function setConnection(mode) {
        $('#connection-status').textContent = mode;
        $('#connection-status').classList.toggle('is-connected', mode === 'BACKEND READY');
      }
      async function initializeBackend() {
        try {
          const [stateResponse, healthResponse] = await Promise.all([fetch('/api/state'), fetch('/api/health')]);
          if (!stateResponse.ok || !healthResponse.ok) throw new Error('Backend is unavailable.');
          const remote = (await stateResponse.json()).state;
          const health = await healthResponse.json();
          if (remote && Array.isArray(remote.assignments) && remote.assignments.length) Object.assign(state, remote);
          state.profile = { ...PROFILE_DEFAULTS, ...(state.profile || {}), ...(remote?.profile || {}) };
          if (!Array.isArray(state.materials)) state.materials = [];
          if (!state.assignments.length) { state.assignments = [structuredClone(sampleAssignment)]; state.activeId = sampleAssignment.id; }
          backendAvailable = true;
          assistantMode = health.assistant === 'configured' ? 'ai' : 'local';
          setConnection('BACKEND READY');
          $('#assistant-mode').textContent = assistantMode === 'ai' ? 'AI CONNECTED' : 'LOCAL COACH';
          applyTheme(state.profile.theme, false);
          render();
        } catch (error) {
          backendAvailable = false;
          setConnection('LOCAL MODE');
          applyTheme(state.profile.theme, false);
          render();
        }
      }
      function applyTheme(theme, save = true) {
        const selected = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.theme = selected;
        const button = $('#theme-toggle');
        button.setAttribute('aria-pressed', String(selected === 'dark'));
        button.setAttribute('aria-label', `Switch to ${selected === 'dark' ? 'light' : 'dark'} mode`);
        button.querySelector('.theme-label').textContent = selected === 'dark' ? 'Light mode' : 'Dark mode';
        state.profile.theme = selected;
        if (save) persist();
      }
      function renderProfile() {
        const profile = state.profile || PROFILE_DEFAULTS;
        const name = profile.name || 'Student';
        $('#profile-name').textContent = name;
        $('#profile-course').textContent = profile.course || 'Student workspace';
        $('#profile-avatar').textContent = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
      }
      function toggleSidebar() {
        const mobile = window.matchMedia('(max-width: 560px)').matches;
        if (mobile) {
          const open = document.body.classList.toggle('sidebar-open');
          $('#sidebar-scrim').hidden = !open;
          $('#sidebar-toggle').setAttribute('aria-expanded', String(open));
        } else {
          const collapsed = document.body.classList.toggle('sidebar-collapsed');
          localStorage.setItem('assignmentos-sidebar-collapsed', String(collapsed));
          $('#sidebar-toggle').setAttribute('aria-expanded', String(!collapsed));
        }
      }
      function closeMobileSidebar() {
        document.body.classList.remove('sidebar-open');
        $('#sidebar-scrim').hidden = true;
        $('#sidebar-toggle').setAttribute('aria-expanded', 'false');
      }
      function openProfile() {
        $('#profile-name-input').value = state.profile.name || '';
        $('#profile-course-input').value = state.profile.course || '';
        $('#profile-modal').classList.add('open');
        $('#profile-name-input').focus();
      }
      function appendAssistantMessage(role, text) {
        const message = document.createElement('div');
        message.className = `assistant-message ${role === 'user' ? 'assistant-message-user' : 'assistant-message-bot'}`;
        if (role !== 'user') {
          const speaker = document.createElement('span');
          speaker.className = 'assistant-speaker';
          speaker.textContent = 'OS';
          message.append(speaker);
        }
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        message.append(paragraph);
        $('#assistant-messages').append(message);
        message.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      function localAssistantReply(message) {
        const item = assignment();
        const draft = plainText(elements.writing.innerHTML);
        const words = wordCount(draft);
        const open = item.requirements.filter((requirement) => requirement.status !== 'met');
        const question = message.toLowerCase();
        if (/source|citation|reference|evidence/.test(question)) return `Your brief asks for ${item.sourceTarget ? `${item.sourceTarget} identifiable sources` : 'appropriate evidence'}. Choose sources you have read, record their publication details, and connect each one to a specific claim in your own draft.`;
        if (/word|length|short|long/.test(question)) return `Your draft is currently about ${words} words. Compare that with the brief, then expand the least-supported idea rather than adding filler.`;
        const suggestions = open.slice(0, 3).map((requirement) => `• ${requirement.text}`).join('\n');
        return open.length ? `A good next step is to work on one open requirement:\n${suggestions}\n\nStart with the one most central to your argument, then check the source material for evidence. I’m a local coach here; configure an AI provider on the server for generated responses.` : 'Your checklist is marked complete. Re-read the brief and verify that the explanation and evidence are strong, not only present.';
      }
      async function sendAssistantMessage(event) {
        event.preventDefault();
        const input = $('#assistant-input');
        const message = input.value.trim();
        if (!message) return;
        input.value = '';
        appendAssistantMessage('user', message);
        const sendButton = $('#assistant-form button[type="submit"]');
        sendButton.disabled = true;
        try {
          let result;
          if (backendAvailable) {
            await syncState();
            const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, assignmentId: assignment().id }) });
            if (!response.ok) throw new Error(`Assistant returned HTTP ${response.status}.`);
            result = await response.json();
            assistantMode = result.provider === 'ai' ? 'ai' : 'local';
          } else {
            result = { reply: localAssistantReply(message), provider: 'local' };
          }
          $('#assistant-mode').textContent = result.provider === 'ai' ? 'AI CONNECTED' : 'LOCAL COACH';
          appendAssistantMessage('assistant', result.reply);
        } catch (error) {
          console.warn('Assistant request failed; using local guidance.', error);
          $('#assistant-mode').textContent = 'LOCAL COACH';
          appendAssistantMessage('assistant', localAssistantReply(message));
        } finally {
          sendButton.disabled = false;
          input.focus();
        }
      }
      function assignment() { return state.assignments.find((item) => item.id === state.activeId) || state.assignments[0]; }
      function plainText(html) { const node = document.createElement('div'); node.innerHTML = html || ''; return (node.innerText || node.textContent || '').replace(/\u00a0/g, ' ').trim(); }
      function wordCount(text) { return (text.trim().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || []).length; }
      function showToast(message) { elements.toast.textContent = message; elements.toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2600); }
      function escapeHTML(text) { return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
      function relativeDue(value) {
        if (!value) return 'NO DEADLINE SET';
        const days = Math.ceil((new Date(`${value}T23:59:59`) - new Date()) / 86400000);
        if (days < 0) return `OVERDUE BY ${Math.abs(days)} ${Math.abs(days) === 1 ? 'DAY' : 'DAYS'}`;
        if (days === 0) return 'DUE TODAY';
        return `DUE IN ${days} ${days === 1 ? 'DAY' : 'DAYS'}`;
      }
      function updateCounts() {
        const text = plainText(elements.writing.innerHTML);
        const count = wordCount(text);
        $('#word-count').textContent = `${count.toLocaleString()} ${count === 1 ? 'word' : 'words'}`;
        $('#reading-time').textContent = `~${Math.max(1, Math.ceil(count / 220))} min read`;
      }
      function render() {
        const item = assignment();
        if (!item) return;
        $('#assignment-title').textContent = item.title;
        $('#subject-label').textContent = item.subject || `${(item.course || 'ASSIGNMENT').toUpperCase()} · WORKSPACE`;
        $('#assignment-course').textContent = item.course || 'Independent study';
        $('#assignment-word-target').textContent = item.minWords && item.maxWords ? `${item.minWords.toLocaleString()}–${item.maxWords.toLocaleString()} words` : item.targetWords ? `${item.targetWords.toLocaleString()} word target` : 'Word count open';
        $('#assignment-source-target').textContent = item.sourceTarget ? `${item.sourceTarget} sources` : 'Sources as needed';
        $('#due-label').textContent = relativeDue(item.due);
        elements.writing.innerHTML = item.content || '';
        renderRequirements(); renderMaterials(); renderStatus(); updateCounts(); renderOverview(); renderTimeline(); renderProfile(); persist();
      }
      function renderRequirements() {
        const item = assignment();
        elements.requirements.innerHTML = item.requirements.map((requirement) => `
          <div class="requirement-row ${requirement.status === 'met' ? 'is-met' : ''}" data-id="${escapeHTML(requirement.id)}">
            <input class="requirement-check" type="checkbox" aria-label="Mark requirement complete" ${requirement.status === 'met' ? 'checked' : ''}>
            <div class="requirement-text" contenteditable="true" role="textbox" aria-label="Edit requirement">${escapeHTML(requirement.text)}</div>
            <span class="requirement-tools"><button class="mini-button delete-requirement" title="Remove requirement" aria-label="Remove requirement">×</button></span>
          </div>`).join('') || '<div class="empty-state">No requirements yet. Add one or paste the brief into a new assignment.</div>';
        elements.requirements.querySelectorAll('.requirement-row').forEach((row) => {
          const requirement = item.requirements.find((entry) => entry.id === row.dataset.id);
          row.querySelector('input').addEventListener('change', (event) => { requirement.status = event.target.checked ? 'met' : 'unchecked'; renderRequirements(); persist(); });
          row.querySelector('.requirement-text').addEventListener('input', (event) => { requirement.text = event.currentTarget.textContent.trim(); persist(); });
          row.querySelector('.delete-requirement').addEventListener('click', () => { item.requirements = item.requirements.filter((entry) => entry.id !== requirement.id); renderRequirements(); renderStatus(); persist(); });
        });
      }
      function renderStatus() {
        const item = assignment();
        const count = wordCount(plainText(elements.writing.innerHTML));
        const lengthStatus = !item.targetWords && !item.minWords ? 'partial' : (item.minWords && item.maxWords ? count >= item.minWords && count <= item.maxWords : count >= (item.targetWords || 1)) ? 'met' : count ? 'partial' : 'missing';
        const citationCount = countSources(plainText(elements.writing.innerHTML));
        const citationStatus = item.sourceTarget ? citationCount >= item.sourceTarget ? 'met' : citationCount ? 'partial' : 'missing' : 'partial';
        const sectionNames = item.requirements.filter((requirement) => requirement.type === 'section');
        const sectionStatus = sectionNames.length ? (sectionNames.every((requirement) => headingMatches(requirement.text)) ? 'met' : count ? 'partial' : 'missing') : elements.writing.querySelector('h1,h2,h3') ? 'met' : count ? 'partial' : 'missing';
        const concepts = item.requirements.filter((entry) => entry.type === 'concept');
        const matchedConcepts = concepts.filter((entry) => hasConcept(plainText(elements.writing.innerHTML), entry.text)).length;
        const conceptStatus = matchedConcepts === concepts.length && concepts.length ? 'met' : matchedConcepts ? 'partial' : count ? 'partial' : 'missing';
        const statuses = [
          { name: 'Length', state: lengthStatus, count: item.minWords && item.maxWords ? `${count}/${item.maxWords}` : `${count} words` },
          { name: 'Required concepts', state: conceptStatus, count: `${matchedConcepts}/${concepts.length} found` },
          { name: 'Sources', state: citationStatus, count: item.sourceTarget ? `${citationCount}/${item.sourceTarget}` : `${citationCount} found` },
          { name: 'Structure', state: sectionStatus, count: `${elements.writing.querySelectorAll('h1,h2,h3').length} headings` }
        ];
        $('#status-list').innerHTML = statuses.map((entry) => `<div class="status-item"><span class="status-dot ${entry.state}"></span><span>${entry.name}</span><span class="status-count">${entry.count}</span></div>`).join('');
      }
      function escapeRegExp(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
      function hasConcept(text, requirement) {
        const ignored = new Set(['explain', 'describe', 'discuss', 'analyze', 'analyse', 'compare', 'evaluate', 'identify', 'include', 'use', 'write', 'about', 'process', 'concept', 'section', 'two', 'three', 'four', 'five', 'one', 'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into']);
        const terms = requirement.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || [];
        const keywords = terms.filter((term) => !ignored.has(term)).map((term) => term.endsWith('ies') ? `${term.slice(0, -3)}y` : term.endsWith('s') ? term.slice(0, -1) : term);
        const content = text.toLowerCase();
        return keywords.length > 0 && keywords.some((keyword) => content.includes(keyword));
      }
      function countSources(text) {
        const citations = (text.match(/\([^()\n]{2,80},?\s?(?:19|20)\d{2}[a-z]?\)|\[[0-9]{1,2}\]/gi) || []).length;
        const referenceHeading = Array.from(elements.writing.querySelectorAll('h1,h2,h3')).find((heading) => /^(references|works cited|bibliography)\s*:?$/i.test(heading.textContent.trim()));
        let entries = 0;
        for (let node = referenceHeading?.nextElementSibling; node && !/^H[1-3]$/.test(node.tagName); node = node.nextElementSibling) {
          entries += node.innerHTML.split(/<br\s*\/?>/i).filter((line) => line.replace(/<[^>]*>/g, '').trim().length > 8).length;
        }
        return Math.max(citations, entries);
      }
      function headingMatches(requirement) {
        const name = requirement.replace(/^include a\s+/i, '').replace(/\s+section$/i, '').trim();
        return Array.from(elements.writing.querySelectorAll('h1,h2,h3')).some((heading) => heading.textContent.trim().toLowerCase() === name.toLowerCase());
      }
      function classifyRequirement(text) {
        if (/\b(word|page|length|words)\b/i.test(text)) return 'length';
        if (/\b(source|citation|reference)\b/i.test(text)) return 'sources';
        if (/\b(section|heading|introduction|conclusion|abstract|methodology)\b/i.test(text)) return 'section';
        if (/\b(due|deadline|submit)\b/i.test(text)) return 'deadline';
        return 'concept';
      }
      function quantity(value) {
        const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
        return Number(value.replaceAll(',', '')) || words[value.toLowerCase()] || 0;
      }
      function extractRequirements(instructions, target) {
        const found = [];
        const add = (text, type = classifyRequirement(text)) => { const clean = text.trim().replace(/[.!?]+$/, ''); if (clean && !found.some((item) => item.text.toLowerCase() === clean.toLowerCase())) found.push({ id: `r-${crypto.randomUUID()}`, text: clean, type, status: 'unchecked' }); };
        const quantityPattern = '(?:\\d[\\d,]*|one|two|three|four|five|six|seven|eight|nine|ten)';
        const range = instructions.match(new RegExp(`\\b(${quantityPattern})\\s*(?:-|to|–)\\s*(${quantityPattern})\\s*(words?|pages?)\\b`, 'i'));
        if (range) add(`Write between ${quantity(range[1]).toLocaleString()} and ${quantity(range[2]).toLocaleString()} ${range[3].toLowerCase()}`, 'length');
        else if (target) add(`Write approximately ${Number(target).toLocaleString()} words`, 'length');
        const sources = instructions.match(new RegExp(`\\b(?:at least|minimum of|min\\.?\\s*)?(${quantityPattern})\\s+(?:academic\\s+|credible\\s+|scholarly\\s+)?sources?\\b`, 'i'));
        if (sources) add(`Use at least ${quantity(sources[1])} identifiable sources`, 'sources');
        const sections = instructions.match(/\b(?:include|with|containing|sections?[: ]+)\s+((?:an?\s+)?(?:introduction|conclusion|abstract|methodology|discussion|results)(?:\s*(?:,|and|&)\s*(?:an?\s+)?(?:introduction|conclusion|abstract|methodology|discussion|results))*)/i);
        if (sections) sections[1].split(/,|\band\b|&/i).map((section) => section.trim()).filter(Boolean).forEach((section) => add(`Include a ${section.toLowerCase()} section`, 'section'));
        const actions = instructions.matchAll(/\b(explain|discuss|describe|analyze|analyse|compare|evaluate|cover|address)\s+([^.!?]+?)(?=\s+(?:and\s+)?(?:explain|discuss|describe|analyze|analyse|compare|evaluate|cover|address)\b|[.!?]|$)/gi);
        for (const [, verb, detail] of actions) if (detail.trim().length > 3) add(`${verb} ${detail.trim()}`, 'concept');
        if (!found.length && instructions.trim()) instructions.split(/[.!?]+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 12).slice(0, 6).forEach((sentence) => add(sentence));
        if (!found.length) add('Add a key idea from the assignment brief', 'concept');
        return found;
      }
      function analyze() {
        const item = assignment();
        const text = plainText(elements.writing.innerHTML);
        const count = wordCount(text);
        let met = 0, partial = 0, missing = 0;
        const feedback = [];
        item.requirements.forEach((requirement) => {
          let status = 'missing';
          if (requirement.type === 'length') {
            const nums = requirement.text.match(/[\d,]+/g)?.map((value) => Number(value.replaceAll(',', ''))) || [];
            if (nums.length >= 2) status = count >= nums[0] && count <= nums[1] ? 'met' : count > 0 ? 'partial' : 'missing';
            else status = count >= (nums[0] || item.targetWords || 1) ? 'met' : count > 0 ? 'partial' : 'missing';
            if (status !== 'met') feedback.push(count ? `The draft has ${count.toLocaleString()} words; check the ${requirement.text.toLowerCase()} target.` : 'Add a first draft so length can be checked.');
          } else if (requirement.type === 'sources') {
            const citations = countSources(text);
            const list = citations > 0;
            const target = Number(requirement.text.match(/\d+/)?.[0] || 1);
            status = citations >= target || (list && citations + 1 >= target) ? 'met' : citations || list ? 'partial' : 'missing';
            if (status !== 'met') feedback.push(`Only ${citations} identifiable citation or reference entries were detected. Check the source requirement manually.`);
          } else if (requirement.type === 'section') {
            const name = requirement.text.replace(/^include a\s+/i, '').replace(/\s+section$/i, '');
            status = headingMatches(requirement.text) ? 'met' : 'missing';
            if (status !== 'met') feedback.push(`Add or label the “${name}” section if the brief requires it.`);
          } else {
            const matched = hasConcept(text, requirement.text);
            status = matched ? 'met' : text ? 'missing' : 'missing';
            if (status !== 'met') feedback.push(`Make the coverage of “${requirement.text}” explicit, and support it with evidence where appropriate.`);
          }
          if (status === 'met') met++; else if (status === 'partial') partial++; else missing++;
        });
        if (!item.requirements.length) feedback.push('Add requirements from the brief to make this check useful.');
        const score = item.requirements.length ? Math.round((met + partial * .5) / item.requirements.length * 100) : 0;
        $('#score-ring').style.setProperty('--score', `${score}%`);
        $('#score-value').textContent = `${score}`;
        $('#analysis-title').textContent = missing ? `${missing} ${missing === 1 ? 'item' : 'items'} to revisit` : partial ? 'Nearly there' : 'Looking complete';
        $('#analysis-subtitle').textContent = `${met} met · ${partial} partial · ${missing} to review`;
        const note = $('#analysis-note'); note.classList.toggle('visible', feedback.length > 0);
        note.textContent = feedback.slice(0, 3).join(' ');
        $('#analysis-summary').textContent = 'This local check uses word counts, headings, and phrase matching, not semantic AI. Treat it as a prompt to review, not a grade.';
        lastAnalysis = { score, met, partial, missing, feedback };
        renderStatus();
        showToast('Draft checked against your current requirements.');
      }
      function renderMaterials() {
        $('#materials-count').textContent = `${state.materials.length} ${state.materials.length === 1 ? 'FILE' : 'FILES'}`;
        elements.materials.innerHTML = state.materials.map((material) => `<div class="material-item"><span class="file-badge">PDF</span><div style="min-width:0;flex:1"><div class="material-name" title="${escapeHTML(material.name)}">${escapeHTML(material.name)}</div><div class="material-detail">${material.pages.length} PAGES · READY</div></div><button class="mini-button remove-material" data-id="${escapeHTML(material.id)}" title="Remove PDF" aria-label="Remove PDF">×</button></div>`).join('') || '<div class="material-empty">No course materials yet.<br>Your files stay in this browser.</div>';
        elements.materials.querySelectorAll('.remove-material').forEach((button) => button.addEventListener('click', () => { state.materials = state.materials.filter((material) => material.id !== button.dataset.id); renderMaterials(); runSearch(); persist(); showToast('Material removed from this workspace.'); }));
      }
      function renderOverview() {
        $('#assignment-count').textContent = `${state.assignments.length} ${state.assignments.length === 1 ? 'ASSIGNMENT' : 'ASSIGNMENTS'}`;
        $('#overview-list').innerHTML = state.assignments.map((item) => `<button class="requirement-row" data-assignment="${escapeHTML(item.id)}" style="width:100%;border:0;background:transparent;text-align:left;cursor:pointer;padding:15px 18px"><span class="status-dot ${item.id === state.activeId ? 'met' : ''}"></span><span class="requirement-text"><strong>${escapeHTML(item.title)}</strong><br><span style="color:#909990">${escapeHTML(item.course || 'Independent study')} · ${escapeHTML(relativeDue(item.due))}</span></span><span class="panel-kicker">OPEN →</span></button>`).join('') + '<div style="padding:0 18px 14px"><button class="button button-small" id="overview-new">＋ New assignment</button></div>';
        $$('#overview-list [data-assignment]').forEach((button) => button.addEventListener('click', () => { state.activeId = button.dataset.assignment; switchView('workspace'); render(); }));
        $('#overview-new')?.addEventListener('click', openModal);
      }
      function renderTimeline() {
        const items = state.assignments.filter((item) => item.due).sort((a, b) => a.due.localeCompare(b.due));
        $('#timeline-list').innerHTML = items.map((item) => `<div class="requirement-row"><span class="status-dot ${new Date(`${item.due}T23:59:59`) < new Date() ? 'missing' : 'partial'}"></span><span class="requirement-text"><strong>${escapeHTML(item.title)}</strong><br><span style="color:#909990">${escapeHTML(item.course || 'Independent study')}</span></span><span class="due-pill">${escapeHTML(relativeDue(item.due))}</span></div>`).join('') || '<div class="empty-state">No deadlines yet. Add an assignment deadline to see it here.</div>';
      }
      function switchView(view) {
        activeView = view;
        $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
        $('#workspace-view').hidden = view !== 'workspace'; $('#overview-view').hidden = view !== 'overview'; $('#timeline-view').hidden = view !== 'timeline'; $('#materials-view').hidden = view !== 'materials';
        const labels = { workspace: 'My assignments', overview: 'Overview', timeline: 'Timeline', materials: 'Course materials' };
        $('#crumb-title').textContent = labels[view];
        $('#page-title').textContent = view === 'workspace' ? 'Make progress, not tabs.' : labels[view];
        $('#page-subtitle').textContent = view === 'workspace' ? 'One calm place for the brief, your writing, and what still needs attention.' : ({ overview: 'All your active assignment workspaces, together.', timeline: 'Deadlines at a glance. Keep the next step manageable.', materials: 'Your source library stays attached to your assignment work.' })[view];
        $('#export-button').hidden = view !== 'workspace';
        if (view === 'materials') $('#materials-view .empty-state').textContent = state.materials.length ? `${state.materials.length} PDF${state.materials.length === 1 ? '' : 's'} available in your active assignment workspace. Open My assignments to search the extracted pages.` : 'No materials uploaded yet. Open My assignments to add a text-based course PDF.';
      }
      function openModal() { elements.modal.classList.add('open'); $('#form-title').focus(); }
      function closeModal() { elements.modal.classList.remove('open'); }
      function createAssignment(event) {
        event.preventDefault();
        const title = $('#form-title').value.trim();
        const instructions = $('#form-instructions').value.trim();
        const target = Number($('#form-target').value) || 0;
        const requirements = extractRequirements(instructions, target);
        const wordRange = instructions.match(/\b(\d[\d,]*)\s*(?:-|to|–)\s*(\d[\d,]*)\s*words?\b/i);
        const sourceTargetMatch = instructions.match(new RegExp(`\\b(?:at least|minimum of|min\\.?\\s*)?((?:\\d[\\d,]*|one|two|three|four|five|six|seven|eight|nine|ten))\\s+(?:academic\\s+|credible\\s+|scholarly\\s+)?sources?\\b`, 'i'));
        const sourceTarget = sourceTargetMatch ? quantity(sourceTargetMatch[1]) : 0;
        const item = { id: `assignment-${crypto.randomUUID()}`, title, course: $('#form-course').value.trim() || 'Independent study', subject: $('#form-course').value.trim().toUpperCase() || 'NEW ASSIGNMENT', due: $('#form-due').value, targetWords: target || (wordRange ? Number(wordRange[1].replaceAll(',', '')) : 0), minWords: wordRange ? Number(wordRange[1].replaceAll(',', '')) : 0, maxWords: wordRange ? Number(wordRange[2].replaceAll(',', '')) : 0, sourceTarget, instructions, requirements, content: '' };
        state.assignments.unshift(item); state.activeId = item.id; closeModal(); $('#assignment-form').reset(); switchView('workspace'); render(); showToast(`${requirements.length} starting requirements added. Review and edit them.`);
      }
      function format(command, value) { elements.writing.focus(); document.execCommand(command, false, value || null); updateCounts(); saveDraft(); }
      function saveDraft() { const item = assignment(); item.content = elements.writing.innerHTML; updateCounts(); renderStatus(); persist(); }
      function exportDraft() {
        const item = assignment();
        const content = `${item.title}\n${item.course || ''}\n\n${plainText(elements.writing.innerHTML)}\n`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
        anchor.href = url; anchor.download = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'assignment'}-draft.txt`; anchor.click(); URL.revokeObjectURL(url); showToast('Draft exported as a text file.');
      }
      async function ingestPDF(file) {
        if (!file) return;
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { showToast('Choose a PDF file to add course material.'); return; }
        if (file.size > 20 * 1024 * 1024) { showToast('This PDF is over the 20 MB limit.'); return; }
        if (!window.pdfjsLib) { showToast('PDF reader unavailable. Check your connection and try again.'); return; }
        $('#materials-count').textContent = 'READING PDF';
        try {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const bytes = await file.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
          const pages = [];
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const text = textContent.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
            if (text) pages.push({ page: pageNumber, text });
          }
          if (!pages.length) { showToast('No selectable text found. Scanned PDFs need OCR, which is on the roadmap.'); renderMaterials(); return; }
          state.materials.push({ id: `material-${crypto.randomUUID()}`, name: file.name, size: file.size, pages });
          persist(); renderMaterials(); runSearch(); showToast(`${pages.length} pages indexed with source page numbers.`);
        } catch (error) { console.error('PDF processing failed.', error); showToast('Could not read this PDF. Try a text-based, unprotected file.'); renderMaterials(); }
      }
      function runSearch() {
        const query = elements.search.value.trim();
        if (!query) { elements.results.innerHTML = '<p class="search-hint">Add a PDF, then search for a topic. Matches keep their page number so you can return to the source.</p>'; return; }
        const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 1);
        const hits = [];
        state.materials.forEach((material) => material.pages.forEach((page) => {
          const haystack = page.text.toLowerCase();
          const matches = terms.filter((term) => haystack.includes(term)).length;
          if (matches) hits.push({ material, page, matches, index: Math.max(0, Math.min(...terms.map((term) => haystack.indexOf(term)).filter((position) => position >= 0))) });
        }));
        hits.sort((a, b) => b.matches - a.matches || a.index - b.index);
        if (!hits.length) { elements.results.innerHTML = '<p class="search-hint">No page text matched that search. Try a broader term or a related concept.</p>'; return; }
        elements.results.innerHTML = hits.slice(0, 5).map(({ material, page, index }) => {
          const start = Math.max(0, index - 65); const excerpt = page.text.slice(start, start + 220); const safe = escapeHTML(excerpt);
          const highlighted = terms.reduce((value, term) => value.replace(new RegExp(`(${escapeRegExp(term)})`, 'ig'), '<mark>$1</mark>'), safe);
          return `<article class="search-result"><span class="result-meta">${escapeHTML(material.name)} · PAGE ${page.page}</span><p>${start ? '…' : ''}${highlighted}${start + 220 < page.text.length ? '…' : ''}</p></article>`;
        }).join('');
      }

      $('#today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
      document.body.classList.toggle('sidebar-collapsed', localStorage.getItem('assignmentos-sidebar-collapsed') === 'true');
      $('#sidebar-toggle').setAttribute('aria-expanded', String(!document.body.classList.contains('sidebar-collapsed')));
      $$('.nav-item').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
      $$('.nav-item').forEach((button) => button.addEventListener('click', closeMobileSidebar));
      $('#new-assignment').addEventListener('click', openModal); $('#close-modal').addEventListener('click', closeModal); $('#cancel-modal').addEventListener('click', closeModal);
      elements.modal.addEventListener('click', (event) => { if (event.target === elements.modal) closeModal(); });
      $('#sidebar-toggle').addEventListener('click', toggleSidebar);
      $('#sidebar-scrim').addEventListener('click', closeMobileSidebar);
      $('#profile-open').addEventListener('click', openProfile);
      $('#close-profile').addEventListener('click', () => $('#profile-modal').classList.remove('open'));
      $('#cancel-profile').addEventListener('click', () => $('#profile-modal').classList.remove('open'));
      $('#profile-modal').addEventListener('click', (event) => { if (event.target === $('#profile-modal')) $('#profile-modal').classList.remove('open'); });
      $('#profile-form').addEventListener('submit', (event) => {
        event.preventDefault();
        state.profile.name = $('#profile-name-input').value.trim() || PROFILE_DEFAULTS.name;
        state.profile.course = $('#profile-course-input').value.trim() || PROFILE_DEFAULTS.course;
        renderProfile(); persist(); $('#profile-modal').classList.remove('open'); showToast('Profile saved to this workspace.');
      });
      $('#theme-toggle').addEventListener('click', () => applyTheme(state.profile.theme === 'dark' ? 'light' : 'dark'));
      $('#assistant-form').addEventListener('submit', sendAssistantMessage);
      $$('.assistant-prompt').forEach((button) => button.addEventListener('click', () => { $('#assistant-input').value = button.dataset.prompt; $('#assistant-form').requestSubmit(); }));
      $('#assignment-form').addEventListener('submit', createAssignment);
      $('#add-requirement').addEventListener('click', () => { const requirement = { id: `r-${crypto.randomUUID()}`, text: 'New requirement - click to edit', type: 'concept', status: 'unchecked' }; assignment().requirements.push(requirement); renderRequirements(); elements.requirements.querySelector(`[data-id="${requirement.id}"] .requirement-text`).focus(); persist(); });
      elements.writing.addEventListener('input', saveDraft); elements.writing.addEventListener('blur', saveDraft);
      $$('.toolbar-button').forEach((button) => button.addEventListener('click', () => format(button.dataset.command, button.dataset.value)));
      $('#analyze-button').addEventListener('click', analyze); $('#export-button').addEventListener('click', exportDraft);
      elements.fileInput.addEventListener('change', (event) => { ingestPDF(event.target.files[0]); event.target.value = ''; });
      elements.search.addEventListener('input', runSearch);
      const drop = $('#upload-drop');
      ['dragenter', 'dragover'].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add('dragover'); }));
      ['dragleave', 'drop'].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove('dragover'); }));
      drop.addEventListener('drop', (event) => ingestPDF(event.dataTransfer.files[0]));
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { closeModal(); $('#profile-modal').classList.remove('open'); closeMobileSidebar(); }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveDraft(); showToast('Draft saved on this device.'); }
      });
      render();
      initializeBackend();
    })();
