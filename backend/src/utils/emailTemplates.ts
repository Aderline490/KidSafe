const BASE = `font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a2e`;
const HEADER = `background:#6c63ff;padding:28px 32px;border-radius:12px 12px 0 0`;
const BODY = `background:#ffffff;padding:28px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none`;
const FOOTER = `color:#9ca3af;font-size:12px;text-align:center;margin-top:20px`;
const BTN = `display:inline-block;padding:12px 28px;background:#6c63ff;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-top:16px`;
const APP_BOX = `background:#f5f3ff;border:2px dashed #6c63ff;border-radius:10px;padding:16px 24px;margin:20px 0;text-align:center`;

function wrap(body: string): string {
  return `<div style="${BASE}">${body}<p style="${FOOTER}">KidSafe · Rwanda Child Welfare Platform · This is an automated message.</p></div>`;
}

export function proposalConfirmationEmail(opts: {
  firstName: string;
  childName: string;
  applicationNumber: string;
  adoptionType: string;
  trackingUrl: string;
}): string {
  return wrap(`
    <div style="${HEADER}">
      <h2 style="color:#fff;margin:0;font-size:22px">Application Received</h2>
      <p style="color:#e0d9ff;margin:6px 0 0;font-size:14px">KidSafe Adoption Platform</p>
    </div>
    <div style="${BODY}">
      <p>Dear <strong>${opts.firstName}</strong>,</p>
      <p>Thank you for submitting your adoption application for <strong>${opts.childName}</strong>. We have received your request and it is now under review.</p>

      <div style="${APP_BOX}">
        <p style="margin:0 0 6px;font-size:12px;color:#6c63ff;font-weight:700;letter-spacing:1px;text-transform:uppercase">Your Application Number</p>
        <p style="margin:0;font-size:28px;font-weight:900;color:#6c63ff;letter-spacing:3px">${opts.applicationNumber}</p>
        <p style="margin:6px 0 0;font-size:12px;color:#7c6fb0">Keep this number — you will need it to track your application.</p>
      </div>

      <p><strong>Application type:</strong> ${opts.adoptionType}</p>

      <p>A social worker will be assigned to your application and will contact you within <strong>5–7 business days</strong>. They may schedule a home visit as part of the review process.</p>

      <a href="${opts.trackingUrl}" style="${BTN}">Track My Application</a>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:13px;color:#6b7280">
        <strong>What happens next?</strong><br>
        1. Social worker review &amp; home visit<br>
        2. District Commissioner approval<br>
        3. NCDA final approval<br>
        4. Child placement
      </p>
      <p style="font-size:13px;color:#6b7280">
        You will receive an email at every stage of the process. If you have questions, contact us at <a href="mailto:support@kidsafe.rw" style="color:#6c63ff">support@kidsafe.rw</a>.
      </p>
    </div>
  `);
}

const STATUS_MESSAGES: Record<string, { title: string; body: string; color: string }> = {
  home_visit_scheduled: {
    title: "Home Visit Scheduled",
    body: "A social worker has been assigned to your case and will be scheduling a home visit. You will be contacted directly with the date and time.",
    color: "#f59e0b",
  },
  home_visit_completed: {
    title: "Home Visit Completed",
    body: "Your home visit has been completed. The social worker's report is now being reviewed. We will notify you of the next steps.",
    color: "#3b82f6",
  },
  level1_approved: {
    title: "Social Worker Approved ✓",
    body: "Your application has been approved by the assigned Social Worker. It is now forwarded to the District Commissioner for review.",
    color: "#10b981",
  },
  level1_rejected: {
    title: "Application Not Approved",
    body: "After review, the Social Worker was unable to approve your application at this time. Please contact our office for more information.",
    color: "#ef4444",
  },
  level2_approved: {
    title: "District Commissioner Approved ✓",
    body: "Your application has been approved by the District Commissioner. It has now been forwarded to the NCDA for final review.",
    color: "#10b981",
  },
  level2_rejected: {
    title: "Application Not Approved",
    body: "The District Commissioner was unable to approve your application at this stage. Please contact our office for more information.",
    color: "#ef4444",
  },
  level3_approved: {
    title: "NCDA Approved ✓",
    body: "Excellent news — the National Child Development Agency has approved your application. Final confirmation is being prepared.",
    color: "#10b981",
  },
  level3_rejected: {
    title: "Application Not Approved",
    body: "The NCDA was unable to approve your application. Please contact our office for details.",
    color: "#ef4444",
  },
  approved: {
    title: "🎉 Adoption Fully Approved!",
    body: "Congratulations! Your adoption application has been fully approved at all levels. A KidSafe coordinator will contact you within 48 hours to arrange the child placement.",
    color: "#10b981",
  },
  rejected: {
    title: "Application Closed",
    body: "Your application has been closed. Please contact our office if you would like to discuss this decision or explore other options.",
    color: "#6b7280",
  },
  withdrawn: {
    title: "Application Withdrawn",
    body: "Your application has been marked as withdrawn.",
    color: "#6b7280",
  },
};

export function documentUploadRequestEmail(opts: {
  firstName: string;
  childName: string;
  applicationNumber: string;
  uploadUrl: string;
  trackingUrl: string;
}): string {
  return wrap(`
    <div style="${HEADER}">
      <h2 style="color:#fff;margin:0;font-size:22px">Action Required: Upload Your Documents</h2>
      <p style="color:#e0d9ff;margin:6px 0 0;font-size:14px">Application ${opts.applicationNumber}</p>
    </div>
    <div style="${BODY}">
      <p>Dear <strong>${opts.firstName}</strong>,</p>
      <p>A social worker has been assigned to your adoption application for <strong>${opts.childName}</strong>. To move your case forward, please upload the required supporting documents as soon as possible.</p>

      <p style="font-weight:700;margin-bottom:8px">Required documents:</p>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:2">
        <li>National ID / Passport (front &amp; back)</li>
        <li>Criminal record certificate</li>
        <li>Proof of income or employment letter</li>
        <li>Marriage certificate <em>(if applicable)</em></li>
      </ul>

      <p>You do not need to create an account. Upload directly using your application number and national ID:</p>

      <a href="${opts.uploadUrl}" style="${BTN}">Upload My Documents</a>

      <div style="${APP_BOX}">
        <p style="margin:0 0 6px;font-size:12px;color:#6c63ff;font-weight:700;letter-spacing:1px;text-transform:uppercase">Your Application Number</p>
        <p style="margin:0;font-size:26px;font-weight:900;color:#6c63ff;letter-spacing:3px">${opts.applicationNumber}</p>
      </div>

      <p style="font-size:13px;color:#6b7280">
        You can also track your application status at any time:<br>
        <a href="${opts.trackingUrl}" style="color:#6c63ff">${opts.trackingUrl}</a>
      </p>
      <p style="font-size:13px;color:#6b7280">
        Questions? Contact us at <a href="mailto:support@kidsafe.rw" style="color:#6c63ff">support@kidsafe.rw</a>
      </p>
    </div>
  `);
}

export function proposalStatusUpdateEmail(opts: {
  firstName: string;
  childName: string;
  applicationNumber: string;
  status: string;
  trackingUrl: string;
}): string | null {
  const msg = STATUS_MESSAGES[opts.status];
  if (!msg) return null;

  return wrap(`
    <div style="background:${msg.color};padding:28px 32px;border-radius:12px 12px 0 0">
      <h2 style="color:#fff;margin:0;font-size:20px">${msg.title}</h2>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Application ${opts.applicationNumber}</p>
    </div>
    <div style="${BODY}">
      <p>Dear <strong>${opts.firstName}</strong>,</p>
      <p>There is an update on your adoption application for <strong>${opts.childName}</strong>:</p>
      <div style="background:#f9fafb;border-left:4px solid ${msg.color};padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0">
        <p style="margin:0;font-size:14px">${msg.body}</p>
      </div>
      <div style="${APP_BOX}">
        <p style="margin:0 0 4px;font-size:11px;color:#6c63ff;font-weight:700;letter-spacing:1px;text-transform:uppercase">Application Number</p>
        <p style="margin:0;font-size:22px;font-weight:900;color:#6c63ff;letter-spacing:2px">${opts.applicationNumber}</p>
      </div>
      <a href="${opts.trackingUrl}" style="${BTN}">View Full Status</a>
      <p style="font-size:13px;color:#6b7280;margin-top:20px">
        Questions? Contact us at <a href="mailto:support@kidsafe.rw" style="color:#6c63ff">support@kidsafe.rw</a>
      </p>
    </div>
  `);
}
