/* Living Hope, contact endpoint.
   Vercel Node serverless function. Zero dependencies: Resend is called over
   its REST API with plain fetch, so this needs no package.json and no build.
   CommonJS on purpose. With no package.json there is no "type":"module", so
   an `export default` here would fail to parse at runtime on Vercel.

   WHY THIS EXISTS
   Every form on this site used to be a mailto:. That composes the message in
   the VISITOR'S OWN mail app, which means (a) nothing is delivered at all if
   they have no mail client, and (b) a survivor's message lands in the Sent
   and Drafts folders of a device somebody else may be checking. The second
   one undoes the entire point of the Quick Exit button.

   RULES THIS FILE KEEPS
   - Nothing is stored. No database, no log of the message body. The request
     is turned into one email and dropped.
   - Nothing sensitive is ever logged, including on the error path.
   - The reply-to is the sender, so Living Hope can just hit reply.
*/

const ENDPOINT = "https://api.resend.com/emails";
const MAX_BYTES = 20000;   // a long message is ~4k; 20k is generous and caps abuse
const MAX_FIELD = 4000;

const SUBJECTS = {
  survivor: "Survivor support request",
  contact: "Website message",
  partnership: "Partnership inquiry",
  newsletter: "Newsletter signup",
};

function clean(v) {
  return String(v == null ? "" : v).slice(0, MAX_FIELD).replace(/\r?\n/g, "\n").trim();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/* A header value containing a newline can inject extra headers. */
function safeHeader(s) {
  return clean(s).replace(/[\r\n]/g, " ").slice(0, 200);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const KEY = process.env.RESEND_API_KEY;
  const TO = process.env.CONTACT_TO;
  const FROM = process.env.CONTACT_FROM;
  if (!KEY || !TO || !FROM) {
    console.error("contact: missing env (RESEND_API_KEY, CONTACT_TO, CONTACT_FROM)");
    return res.status(500).json({ ok: false, error: "not_configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    if (body.length > MAX_BYTES) return res.status(413).json({ ok: false, error: "too_large" });
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ ok: false, error: "bad_json" }); }
  }
  if (!body || typeof body !== "object") return res.status(400).json({ ok: false, error: "bad_body" });

  /* Honeypot. Real people never fill a field they cannot see, so a value here
     is a bot. Answer 200 so the bot believes it worked and does not retry. */
  if (clean(body.company)) return res.status(200).json({ ok: true });

  const kind = SUBJECTS[body.kind] ? body.kind : "contact";
  const fields = Array.isArray(body.fields) ? body.fields.slice(0, 40) : [];
  if (!fields.length) return res.status(400).json({ ok: false, error: "empty" });

  const rows = fields
    .map(function (f) { return { label: clean(f && f.label), value: clean(f && f.value) }; })
    .filter(function (f) { return f.label && f.value; });
  if (!rows.length) return res.status(400).json({ ok: false, error: "empty" });

  const replyTo = rows.find(function (r) { return /^e-?mail$/i.test(r.label); });
  const who = rows.find(function (r) { return /^(full )?name$/i.test(r.label); });

  const subject = SUBJECTS[kind] + (who ? " from " + safeHeader(who.value) : "");
  const text = rows.map(function (r) { return r.label + ": " + r.value; }).join("\n\n");
  const html =
    '<div style="font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#34362E">' +
    '<p style="font:700 12px/1 sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#7E622C">' +
    escapeHtml(SUBJECTS[kind]) + "</p>" +
    rows.map(function (r) {
      return '<p style="margin:0 0 14px"><strong>' + escapeHtml(r.label) + "</strong><br>" +
        escapeHtml(r.value).replace(/\n/g, "<br>") + "</p>";
    }).join("") +
    '<p style="color:#68695C;font-size:13px">Sent from livinghope61.com</p></div>';

  const payload = {
    from: FROM,
    to: [TO],
    subject: subject,
    text: text,
    html: html,
  };
  if (replyTo && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo.value)) {
    payload.reply_to = safeHeader(replyTo.value);
  }

  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      /* status only. The body could echo the message back into the logs. */
      console.error("contact: resend responded " + r.status);
      return res.status(502).json({ ok: false, error: "send_failed" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("contact: network error reaching resend");
    return res.status(502).json({ ok: false, error: "send_failed" });
  }
};
