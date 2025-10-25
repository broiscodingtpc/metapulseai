import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar, StyleSheet} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import AnalyzerScreen from './src/screens/AnalyzerScreen';
import TestScreen from './src/screens/TestScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a0a0a',
            borderBottomWidth: 1,
            borderBottomColor: '#00ff41',
          },
          headerTintColor: '#00ff41',
          headerTitleStyle: {
            fontFamily: 'monospace',
            fontSize: 18,
            fontWeight: 'bold',
          },
          cardStyle: {
            backgroundColor: '#0a0a0a',
          },
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'MetaPulse AI Admin'}}
        />
        <Stack.Screen
          name="Analyzer"
          component={AnalyzerScreen}
          options={{title: 'Token Analyzer'}}
        />
        <Stack.Screen
          name="Test"
          component={TestScreen}
          options={{title: 'API Tests'}}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{title: 'Settings'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;