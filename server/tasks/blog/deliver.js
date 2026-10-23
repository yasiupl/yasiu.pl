// Sends the activities in the delivery queue that are due (see server/utils/ap-deliver.js).
// nitro.config.mjs runs this task each minute.
export default defineTask({
  meta: { name: 'blog:deliver', description: 'Send the due activities of @blog@yasiu.pl' },
  async run() {
    return { result: await processQueue() };
  }
});
