ObjC.import('AppKit');
function run(argv) {
  if (argv.length === 0) return 'usage: osascript -l JavaScript airdrop.js <file> [file...]';
  const items = $.NSMutableArray.alloc.init;
  for (const p of argv) items.addObject($.NSURL.fileURLWithPath(p));
  const app = $.NSApplication.sharedApplication;
  app.setActivationPolicy($.NSApplicationActivationPolicyAccessory);
  app.activateIgnoringOtherApps(true);
  const svc = $.NSSharingService.sharingServiceNamed($.NSSharingServiceNameSendViaAirDrop);
  if (!svc.canPerformWithItems(items)) return 'AirDrop cannot send these files (is AirDrop on?)';
  svc.performWithItems(items);
  $.NSRunLoop.currentRunLoop.runUntilDate($.NSDate.dateWithTimeIntervalSinceNow(600));
  return 'AirDrop sheet closed';
}
