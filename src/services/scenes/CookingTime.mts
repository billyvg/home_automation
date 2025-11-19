import { TServiceParams } from "@digital-alchemy/core";
import { isStateUnavailable } from "../../utils/isStateUnavailable";

/**
 * Manages scenes from entities
 *
 * If you want to use Apple/Siri to trigger scenes, make sure to do so in the
 * Scene settings in the Home app. (Have the scene trigger the switch).
 */
export function CookingTime(service: TServiceParams) {
  const { hass, config, context, lifecycle, logger, synapse } = service;

  lifecycle.onReady(() => {
    const cookingTimeSwitch = synapse.button({
      context,
      icon: "mdi:chef-hat",
      name: "Cooking Time Scene Button",
    });
    const cookingTimeScene = synapse.scene({
      context,
      icon: "mdi:chef-hat",
      name: "Cooking Time Hass Scene",
    });

    cookingTimeSwitch.onUpdate((newState, oldState) => {
      if (isStateUnavailable(newState, oldState)) {
        return;
      }

      cookingTimeScene.getEntity().turn_on();
    });

    cookingTimeScene.onUpdate((newState, oldState) => {
      if (isStateUnavailable(newState, oldState) || newState.state === oldState.state) {
        return;
      }

      hass.refBy.id("light.kitchen_main_lights").turn_on({
        brightness_pct: 100,
      });
      hass.refBy.id("light.living_room_main_lights").turn_on({
        brightness_pct: 35,
      });
    });
  });
}
