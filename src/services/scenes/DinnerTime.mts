import { TServiceParams } from "@digital-alchemy/core";
import { isStateUnavailable } from "../../utils/isStateUnavailable";

/**
 * Manages scenes from entities
 *
 * If you want to use Apple/Siri to trigger scenes, make sure to do so in the
 * Scene settings in the Home app. (Have the scene trigger the switch).
 */
export function DinnerTime(service: TServiceParams) {
  const { hass, config, context, lifecycle, logger, synapse } = service;

  lifecycle.onReady(() => {
    const dinnerTimeSwitch = synapse.button({
      // required variables
      context,
      icon: "mdi:food-turkey",
      name: "Dinner Time Scene Button",
    });
    const dinnerTimeScene = synapse.scene({
      context,
      icon: "mdi:food-turkey",
      name: "Dinner Time Hass Scene",
    });

    dinnerTimeSwitch.onUpdate((newState, oldState) => {
      if (isStateUnavailable(newState, oldState)) {
        return;
      }

      // When restarting newstate is unavailable, old state is unknown
      dinnerTimeScene.getEntity().turn_on();
    });

    dinnerTimeScene.onUpdate((newState, oldState) => {
      if (isStateUnavailable(newState, oldState) || newState.state === oldState.state) {
        return;
      }

      logger.info("Dinner Time Scene started");
      const appleTv = hass.refBy.id("media_player.living_room_atv");

      if (["standby", "off", "idle"].includes(appleTv.state)) {
        hass.call.media_player.turn_on({ entity_id: "media_player.living_room_atv" });
      }

      hass.refBy.id("light.kitchen_main_lights").turn_on({
        brightness_pct: 45,
      });
      hass.refBy.id("light.living_room_main_lights").turn_on({
        brightness_pct: 35,
      });

      if (appleTv.state !== "playing") {
        hass.call.media_player.select_source({
          entity_id: "media_player.living_room_atv",
          source: "Plex",
        });
      }
    });
  });
}
