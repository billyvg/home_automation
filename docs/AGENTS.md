# Agents

This application uses the [Digital Alchemy](https://github.com/digital-alchemy) framework to create and handle automations for [Home Assistant](https://www.home-assistant.io/).

## Testing

When testing @src/services/*, if the service uses `onUpdate` to listen to updates, make sure the tests cover the case where our application restarts which causes both arguments to `onUpdate` (`newState` and `oldState`) to have `state` property set to `"unavailable"`. Then when the service is restarted, the `oldState.state` property starts off as `"unknown"`.