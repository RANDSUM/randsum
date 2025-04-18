# RANDSUM App

A cross-platform dice rolling application for iOS, Android, and Web, powered by the RANDSUM dice library.

## Features

- Roll dice using standard dice notation
- Support for all RANDSUM modifiers (drop, reroll, cap, etc.)
- Save favorite dice combinations
- View detailed roll results and statistics
- Dark mode support
- Offline functionality
- Cross-platform (iOS, Android, Web)

## Development

This app is built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/).

```bash
# Start the development server
bun moon randsum-app:start

# Run on iOS
bun moon randsum-app:ios

# Run on Android
bun moon randsum-app:android

# Run on Web
bun moon randsum-app:web
```

## Building for Production

### iOS

```bash
# Build for iOS
eas build --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android
```

### Web

```bash
# Build for Web
bun moon randsum-app:web
```

## Made with

- [Expo](https://expo.dev/) - React Native framework
- [React Native](https://reactnative.dev/) - Cross-platform mobile framework
- [RANDSUM](https://github.com/RANDSUM/randsum) - Dice rolling library
- [Moon](https://moonrepo.dev) - Build system

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
