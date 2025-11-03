import { query } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';

export type NotifyParams = {
  type: string; // e.g. asset.created
  title: string;
  body: string;
  recipients: string[]; // emails
  entity?: { type?: 'asset' | 'license' | 'vendor' | 'user'; id?: string };
  metadata?: any;
};

async function getOrgDefaults(): Promise<{ channels: { in_app: boolean; email: boolean } } | null> {
  try {
    const rows = await query<any>(`SELECT notify_defaults FROM org_settings WHERE id = 1 LIMIT 1`);
    if (!rows?.length) return null;
    const raw = rows[0]?.notify_defaults;
    const obj = typeof raw === 'object' ? raw : (raw ? JSON.parse(raw) : null);
    if (!obj) return null;
    const channels = obj.channels || obj.channel || {};
    const in_app = Boolean(channels.in_app ?? channels.push ?? true);
    const email = Boolean(channels.email ?? false);
    return { channels: { in_app, email } };
  } catch {
    return null;
  }
}

export async function notify(params: NotifyParams): Promise<void> {
  const uniqueRecipients = Array.from(new Set((params.recipients || []).filter(Boolean)));
  if (!uniqueRecipients.length) return;
  const defaults = await getOrgDefaults();
  const allowInApp = defaults?.channels?.in_app !== false; // default true
  const allowEmail = defaults?.channels?.email === true; // default false

  // Insert in-app notifications
  if (allowInApp) {
    const sql = `INSERT INTO notifications (user_email, type, title, body, entity_type, entity_id, metadata)
                 VALUES (:user_email, :type, :title, :body, :entity_type, :entity_id, :metadata)`;
    for (const email of uniqueRecipients) {
      try {
        await query(sql, {
          user_email: email,
          type: params.type,
          title: params.title,
          body: params.body,
          entity_type: params.entity?.type || null,
          entity_id: params.entity?.id || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        });
      } catch (e) {
        console.error('notify: insert failed for', email, e);
      }
    }
  }

  // Optional email
  if (allowEmail) {
    for (const email of uniqueRecipients) {
      try {
        await sendEmail(email, params.title, params.body);
      } catch (e) {
        console.warn('notify: email failed for', email, e);
      }
    }
  }
}
