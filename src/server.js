const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const {
  AMOCRM_SUBDOMAIN,
  AMOCRM_ACCESS_TOKEN,
  VAPI_API_KEY,
  ELEVENLABS_API_KEY,
} = process.env;

// ─────────────────────────────────────────────
//  VAPI WEBHOOK — основной обработчик звонков
// ─────────────────────────────────────────────
app.post('/webhook/vapi', async (req, res) => {
  const event = req.body;
  console.log('📞 Vapi event:', event.message?.type);

  try {
    // Звонок завершён
    if (event.message?.type === 'end-of-call-report') {
      const report = event.message;
      const callData = {
        callerPhone: report.call?.customer?.number || 'Неизвестно',
        duration: report.durationSeconds || 0,
        summary: report.summary || 'Нет резюме',
        transcript: report.transcript || '',
        recordingUrl: report.recordingUrl || null,
        startedAt: report.startedAt,
        endedAt: report.endedAt,
        endReason: report.endedReason,
      };

      console.log('✅ Звонок завершён:', callData.callerPhone);

      // Создаём сделку в AmoCRM
      await createAmoCRMDeal(callData);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('❌ Ошибка webhook:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  AMOCRM — создание сделки + контакта
// ─────────────────────────────────────────────
async function createAmoCRMDeal(callData) {
  const base = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4`;
  const headers = {
    Authorization: `Bearer ${AMOCRM_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // 1. Создаём или ищем контакт по номеру
  let contactId = await findOrCreateContact(callData.callerPhone, base, headers);

  // 2. Создаём сделку
  const dealPayload = {
    name: `Звонок ${callData.callerPhone} — ${new Date().toLocaleDateString('ru-RU')}`,
    status_id: 142, // Первичный контакт (стандартный статус AmoCRM)
    _embedded: {
      contacts: [{ id: contactId }],
    },
  };

  const dealRes = await axios.post(`${base}/leads`, [dealPayload], { headers });
  const dealId = dealRes.data._embedded.leads[0].id;
  console.log('✅ Сделка создана:', dealId);

  // 3. Добавляем примечание с резюме звонка
  const noteText = `
📞 ИТОГ ЗВОНКА
━━━━━━━━━━━━━━━━━━
📱 Номер: ${callData.callerPhone}
⏱ Длительность: ${callData.duration} сек
📅 Дата: ${new Date(callData.startedAt).toLocaleString('ru-RU')}
🔚 Причина завершения: ${callData.endReason}

📝 РЕЗЮМЕ:
${callData.summary}

${callData.recordingUrl ? `🎵 Запись: ${callData.recordingUrl}` : ''}
━━━━━━━━━━━━━━━━━━
ТРАНСКРИПЦИЯ:
${callData.transcript}
  `.trim();

  await axios.post(
    `${base}/leads/notes`,
    [{ entity_id: dealId, note_type: 'common', params: { text: noteText } }],
    { headers }
  );

  console.log('✅ Примечание добавлено к сделке', dealId);

  // 4. Прикрепляем запись звонка если есть
  if (callData.recordingUrl) {
    await axios.post(
      `${base}/leads/notes`,
      [{ entity_id: dealId, note_type: 'call_in', params: { uniq: Date.now().toString(), duration: callData.duration, source: 'AI Agent', link: callData.recordingUrl, phone: callData.callerPhone } }],
      { headers }
    );
    console.log('✅ Запись звонка прикреплена');
  }
}

async function findOrCreateContact(phone, base, headers) {
  try {
    // Ищем контакт
    const search = await axios.get(`${base}/contacts?query=${encodeURIComponent(phone)}`, { headers });
    const contacts = search.data?._embedded?.contacts;
    if (contacts && contacts.length > 0) {
      console.log('👤 Контакт найден:', contacts[0].id);
      return contacts[0].id;
    }
  } catch (e) { /* контакт не найден */ }

  // Создаём новый контакт
  const res = await axios.post(
    `${base}/contacts`,
    [{ name: phone, custom_fields_values: [{ field_code: 'PHONE', values: [{ value: phone, enum_code: 'WORK' }] }] }],
    { headers }
  );
  const id = res.data._embedded.contacts[0].id;
  console.log('👤 Контакт создан:', id);
  return id;
}

// ─────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
