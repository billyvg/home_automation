import { ENTITY_STATE, PICK_ENTITY } from "@digital-alchemy/hass";
type State =
  | NonNullable<ENTITY_STATE<PICK_ENTITY<"button">>>
  | NonNullable<ENTITY_STATE<PICK_ENTITY<"sensor">>>
  | NonNullable<ENTITY_STATE<PICK_ENTITY<"binary_sensor">>>
  | NonNullable<ENTITY_STATE<PICK_ENTITY<"scene">>>;

/**
 * Ensures that the states of the entity is ok to continue
 *
 * e.g. when we start, they become "unavailable" and then can be "unknown"
 */
export function isStateUnavailable(newState: State, oldState: State) {
  return !oldState || !newState || newState.state === "unavailable" || newState.state === "unknown";
}
