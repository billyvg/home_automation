import { LIB_AUTOMATION } from "@digital-alchemy/automation";
import { CreateApplication, StringConfig } from "@digital-alchemy/core";
import { LIB_HASS } from "@digital-alchemy/hass";
import { LIB_SYNAPSE } from "@digital-alchemy/synapse";

import { HelloWorld } from "./services/HelloWorld.mts";
import { BambuPrinter } from "./services/BambuPrinter.mts";
import { DoorbellFingerprint } from "./services/DoorbellFingerprint.mts";
import { LeakDetectors } from "./services/LeakDetectors.mts";
import { DoorOpened } from "./services/DoorOpened.mts";
import { AntiFreeze } from "./services/AntiFreeze.mts";

import { DinnerTime } from "./services/scenes/DinnerTime.mts";
import { BedTime } from "./services/scenes/BedTime.mts";
import { CookingTime } from "./services/scenes/CookingTime.mts";
import { MovieTime } from "./services/scenes/MovieTime.mts";
import { KitchenMorning } from "./services/KitchenMorning.mts";

type Environments = "development" | "production" | "test";

export const HOME_AUTOMATION = CreateApplication({
  // Add extra config flags & secrets for your app
  // https://docs.digital-alchemy.app/docs/core/techniques/configuration
  configuration: {
    NODE_ENV: {
      type: "string",
      default: "development",
      enum: ["development", "production", "test"],
      description: "Code runner addon can set with it's own NODE_ENV",
    } satisfies StringConfig<Environments>,
  },

  // Adding to this array will provide additional elements in TServiceParams for your code to use
  //
  // - LIB_HASS - type safe home assistant interactions
  // - LIB_SYNAPSE - create helper entities (requires integration)
  // - LIB_AUTOMATION - extra helper utilities focused on home automation tasks (requires synapse)
  // - LIB_MQTT - listen & publish mqtt messages
  //
  // Create your own: https://docs.digital-alchemy.app/docs/core/modules/library
  libraries: [LIB_HASS, LIB_SYNAPSE, LIB_AUTOMATION],

  name: "home_automation",

  // use this list of strings (service names below) to force construction order of services
  priorityInit: [],

  // add new services here in format -- name: Function
  // keys affect how app is wired together & log contexts
  services: {
    HelloWorld,
    AntiFreeze,
    BambuPrinter,
    DoorbellFingerprint,
    LeakDetectors,
    DoorOpened,
    KitchenMorning,

    // Scenes
    BedTime,
    CookingTime,
    DinnerTime,
    MovieTime,
  },
});

declare module "@digital-alchemy/core" {
  export interface LoadedModules {
    // vvv must match declared name
    home_automation: typeof HOME_AUTOMATION;
    home_automation_dev: typeof HOME_AUTOMATION;
  }
}
