"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.META_EVENTS = exports.funnelEventSchema = exports.FUNNEL_EVENTS = void 0;
const zod_1 = require("zod");
/** Internal funnel analytics (server + client). */
exports.FUNNEL_EVENTS = [
    'visit',
    'create_started',
    'photos_uploaded',
    'style_chosen',
    'memories_done',
    'preview_ready',
    'checkout',
    'payment',
    'delivery',
];
exports.funnelEventSchema = zod_1.z.object({
    name: zod_1.z.enum(exports.FUNNEL_EVENTS),
    draftId: zod_1.z.string().optional(),
    orderId: zod_1.z.string().optional(),
    meta: zod_1.z.record(zod_1.z.unknown()).optional(),
    clientId: zod_1.z.string().optional(),
    path: zod_1.z.string().optional(),
});
/** Meta Pixel / CAPI standard events used in MVP */
exports.META_EVENTS = ['ViewContent', 'InitiateCheckout', 'Purchase'];
//# sourceMappingURL=events.js.map