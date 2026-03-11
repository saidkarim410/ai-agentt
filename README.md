# 🤖 AI Voice Agent — Пошаговая инструкция

## Что это?
Система автоматически:
- Принимает и совершает звонки через Sarkor SIP
- Общается с клиентом голосом (женский голос — Алина)
- После звонка создаёт сделку в AmoCRM
- Прикрепляет запись разговора и резюме

---

## 📋 ШАГ 1 — Получить токен AmoCRM

1. Зайди на: `https://entriumuz.amocrm.ru`
2. Перейди: **Настройки → Интеграции → API**
3. Нажми **"Показать ключи"** или **"Получить ключ"**
4. Скопируй **Долгосрочный токен** (Long-lived token)
5. Вставь его в `.env` файл в поле `AMOCRM_ACCESS_TOKEN`

> Если не находишь — зайди по прямой ссылке:
> `https://entriumuz.amocrm.ru/settings/profile/`

---

## 📋 ШАГ 2 — Залить на GitHub

1. Создай аккаунт на [github.com](https://github.com) если нет
2. Нажми **"New Repository"** → назови `ai-voice-agent`
3. Загрузи все файлы из этой папки
4. ⚠️ **НЕ загружай файл `.env`** (там пароли!)

---

## 📋 ШАГ 3 — Деплой на Railway

1. Зайди на [railway.app](https://railway.app)
2. Нажми **"New Project"** → **"Deploy from GitHub"**
3. Выбери репозиторий `ai-voice-agent`
4. Railway сам задеплоит проект!
5. Перейди в **Variables** и добавь все переменные из `.env.example`
6. Скопируй URL проекта (будет вида `https://xxx.railway.app`)

---

## 📋 ШАГ 4 — Настроить агента в Vapi.ai

1. Зайди на [dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Нажми **"Create Assistant"**
3. Скопируй содержимое файла `config/vapi-agent.json`
4. Вставь его в настройки ассистента
5. В поле **Server URL** укажи: `https://ВАШ-URL.railway.app/webhook/vapi`

---

## 📋 ШАГ 5 — Подключить Sarkor SIP в Vapi.ai

1. В Vapi.ai → **Phone Numbers** → **Import SIP Trunk**
2. Заполни:
   - **SIP URI**: `sip:admin@mystep.sip.uz`
   - **Username**: `admin`
   - **Password**: `PqHDWNeSBb`
3. Привяжи этот номер к созданному ассистенту
4. Готово! Теперь звонки идут через AI агента 🎉

---

## ✅ Проверка работы

- Позвони на SIP номер → должен ответить AI голос "Алина"
- После звонка → в AmoCRM должна появиться сделка
- В сделке должны быть: запись звонка + резюме

---

## ❓ Проблемы?

Напиши в чат — разберёмся вместе!
