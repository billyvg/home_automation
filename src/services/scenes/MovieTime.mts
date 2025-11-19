import { TServiceParams } from "@digital-alchemy/core";
import { isStateUnavailable } from "../../utils/isStateUnavailable";

/**
 * Manages scenes from entities
 *
 * If you want to use Apple/Siri to trigger scenes, make sure to do so in the
 * Scene settings in the Home app. (Have the scene trigger the switch).
 */
export function MovieTime(service: TServiceParams) {
  const { hass, config, context, lifecycle, logger, synapse } = service;

  lifecycle.onReady(() => {
    const movieTimeSwitch = synapse.button({
      // required variables
      context,
      icon: "mdi:movie",
      name: "Movie Time Scene Button",
    });
    const movieTimeScene = synapse.scene({
      context,
      icon: "mdi:movie",
      name: "Movie Time Hass Scene",
    });

    movieTimeSwitch.onUpdate((newState, oldState) => {
      if (isStateUnavailable(newState, oldState)) {
        return;
      }

      movieTimeScene.getEntity().turn_on();
    });

    movieTimeScene.onUpdate((newState, oldState) => {
      if (isStateUnavailable(newState, oldState) || newState.state === oldState.state) {
        return;
      }

      hass.refBy.id("light.kitchen_main_lights").turn_off();
      hass.refBy.id("light.living_room_main_lights").turn_off();
      hass.refBy.id("light.front_foyer_main_lights").turn_off();
    });
  });
}
