// Supply the field names used by the retained views alongside the API fields.
export function normalizeApiRecord(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeApiRecord);
  if (!value || typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    const normalized = normalizeApiRecord(entry);
    result[key] = normalized;
    const alias = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (!(alias in record)) result[alias] = normalized;
  }
  const campaign = result.campaign as Record<string, unknown> | undefined;
  if (campaign) {
    result.campaign_id ??= campaign.id;
    result.campaign_title ??= campaign.title;
  }
  const applicant = result.applicant as Record<string, unknown> | undefined;
  if (applicant) {
    result.applicant_id ??= applicant.id;
    result.applicant_name ??= applicant.name;
    result.applicant_email ??= applicant.email;
    result.applicant_phone ??= applicant.phone;
  }
  const payments = result.payments as Record<string, unknown>[] | undefined;
  if (Array.isArray(payments) && payments[0]) {
    result.transaction_id ??= payments[0].transactionId;
    result.payment_gateway ??= payments[0].provider;
    result.paid_at ??= payments[0].paidAt;
  }
  if (record.reactions && record.postedBy) {
    result.postId ??= record.id;
    result.author_id ??= record.authorId;
    result.CommunityResponse ??= {
      Reactions: record.reactions,
      totalComments: record.totalComments,
    };
  }
  if (record.type === 'DONATE' || record.type === 'RECEIVE') {
    result.transaction_type ??= record.type;
    const payment = result.payment as Record<string, unknown> | undefined;
    result.transaction_id ??= payment?.transactionId;
    result.payment_gateway ??= payment?.provider;
    result.paid_at ??= payment?.paidAt ?? record.createdAt;
  }
  return result;
}
