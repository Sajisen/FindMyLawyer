/**
 * @deprecated
 *
 * The project previously had a second lawyer-verification model under this
 * filename. Verification.js is now the single authoritative verification
 * model. This compatibility re-export prevents the old path from creating a
 * separate MongoDB model/collection if an older branch imports it by mistake.
 */
export { default } from "./Verification.js";
