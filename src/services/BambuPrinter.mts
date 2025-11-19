import { TServiceParams } from "@digital-alchemy/core";
import { notifyMe } from "../utils/notify.mts";

export function BambuPrinter(service: TServiceParams) {
  const { hass, config, lifecycle, logger } = service;
  const printStatus = hass.refBy.id("sensor.bambogi_print_status");
  const bedTemperature = hass.refBy.id("sensor.bambogi_bed_temperature");

  lifecycle.onReady(() => {
    /**
     * On print finish, send a notification.
     *
     */
    printStatus.onUpdate((newState, oldState) => {
      if (newState.state !== "finish" || oldState.state === newState.state) {
        // Nothing to do if print is not finished
        return;
      }

      const taskName = hass.refBy.id("sensor.bambogi_task_name");

      // Print has finished //
      notifyMe(
        service,
        "3d Print Completed",
        `${taskName.state} has completed, waiting for bed temperature to cool down...`,
      );
    });

    /**
     * After printing has completed, send a notification when print is ready to be
     * removed (based on filament type).
     */
    bedTemperature.onUpdate((newState, oldState) => {
      if (printStatus.state !== "finish") {
        // Only check temps if printing is completed
        return;
      }

      if (oldState.state < newState.state) {
        // temps are increasing, this shouldn't happen since print should be finished
        return;
      }

      // filament turns "unavailable" after finishing
      // (filament.state.includes("PLA") && currentTemperature <= 45) ||
      // (filament.state.includes("PETG") && currentTemperature <= 50)

      // XXX: It's typed as number, but actually a string
      const currentTemperature = Number(newState.state);

      // We actually just want to check for exact temperature as we only want to alert once
      if (currentTemperature == 45) {
        const taskName = hass.refBy.id("sensor.bambogi_task_name").state;
        const message = `${taskName} is ready to be removed (${currentTemperature}${newState.attributes.unit_of_measurement})`;
        notifyMe(service, "Remove 3d Print", message);
      }
    });
  });
}
