// ECORP Check-in - Netlify Function
// - GET  /.netlify/functions/checkin?config=1 -> returns Google Client ID
// - POST /.netlify/functions/checkin -> proxies authenticated request to Apps Script

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBmIqc2tF6somI5v0ftzQj7wIWLpndn-LRt_dAQWFHSRhTfH3fP1crYSTWUIsbwNWNAw/exec';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Public Google Client ID configuration for the frontend / Apps Script.
  if (event.httpMethod === 'GET' && event.queryStringParameters?.config === '1') {
    const googleClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();

    if (!googleClientId) {
      return json(500, {
        success: false,
        message: 'Netlify chưa cấu hình GOOGLE_CLIENT_ID.'
      });
    }

    return json(200, { googleClientId });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method không được hỗ trợ.' });
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    if (!payload.idToken) {
      return json(400, {
        success: false,
        message: 'Thiếu Google ID token. Vui lòng đăng nhập lại.'
      });
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = {
        success: false,
        message: 'Apps Script trả về dữ liệu không hợp lệ.'
      };
    }

    return json(response.ok ? 200 : 502, data);
  } catch (error) {
    return json(500, {
      success: false,
      message: error?.message || 'Không thể kết nối hệ thống điểm danh.'
    });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
}
