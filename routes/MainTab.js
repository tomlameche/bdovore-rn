/* Copyright 2021 Joachim Pouderoux & Association Bdovore
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import React, { useState } from 'react';
import { Share, TouchableOpacity, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomSheet, ListItem } from 'react-native-elements';
import { CommonActions } from '@react-navigation/native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AlbumScreen from '../screens/AlbumScreen';
import AuteurScreen from '../screens/AuteurScreen';
import BarcodeScanner from '../screens/BarcodeScanner';
import CollectionScreen from '../screens/CollectionScreen';
import ImageScreen from '../screens/ImageScreen';
import LoginScreen from '../screens/LoginScreen';
import NewsScreen from '../screens/NewsScreen';
import SearchScreen from '../screens/SearchScreen';
import SerieScreen from '../screens/SerieScreen';
import ToCompleteScreen from '../screens/ToCompleteScreen';
import WishlistScreen from '../screens/WishlistScreen';
import * as APIManager from '../api/APIManager';
import { bdovored, CommonStyles } from '../styles/CommonStyles';
import SettingsScreen from '../screens/SettingsScreen';


// The main tab navigator
const Tab = createBottomTabNavigator();

// The stack navigators for each tab
const CollectionStack = createStackNavigator();
const WishlistStack = createStackNavigator();
const ToCompleteStack = createStackNavigator();
const NewsStack = createStackNavigator();
const SearchStack = createStackNavigator();

const accountButton = (navigation) => {
  return (
    <TouchableOpacity onPress={() => onAccountPress(navigation)} style={{ margin: 8 }}>
      <MaterialCommunityIcons name='account-circle-outline' size={25} color={CommonStyles.iconStyle.color} />
    </TouchableOpacity>
  );
}

const onAccountPress = (navigation) => {
  navigation.navigate('Login');
};

const shareButton = (item) => {
  return (
    <TouchableOpacity onPress={() => onSharePress(item)} style={{ margin: 8 }}>
      <MaterialCommunityIcons name='share-variant' size={25} color={CommonStyles.iconStyle.color} />
    </TouchableOpacity>
  );
}

const onSharePress = async (item) => {
  const url = APIManager.bdovoreBaseURL + '/Album?id_tome=' + item.ID_TOME;
  Share.share({
    message: url,
    url: url
  });
}

const defaultStackOptions = {
  headerTintColor: global.isDarkMode ? 'white' : bdovored,
  headerTruncatedBackTitle: ''
};

function CollectionScreens({ route, navigation }) {

  const [collectionGenre, setCollectionGenre] = useState(0);
  const [showCollectionChooser, setShowCollectionChooser] = useState(0);

  const collectionGenres = {
    0: ['Tout', ''],
    1: ['BD', ' BD'],
    2: ['Mangas', ' mangas'],
    3: ['Comics', ' comics'],
  };

  const onCollectionGenrePress = (navigation) => {
    setShowCollectionChooser(!showCollectionChooser);
  }

  const onCollectionGenreChanged = (route, navigation, mode) => {
    setCollectionGenre(mode);
    setShowCollectionChooser(false);
    navigation.dispatch({
      ...CommonActions.setParams({
        collectionGenre: mode }),
      source: route.key,
    });
  }

  const settingsButton = (route, navigation) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => onCollectionGenrePress(navigation)} style={{ margin: 8 }}>
          <Ionicons name='library-sharp' size={25} color={CommonStyles.iconStyle.color} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSettingsPress(navigation)} style={{ margin: 8 }}>
          <MaterialCommunityIcons name='dots-vertical' size={25} color={CommonStyles.iconStyle.color} />
        </TouchableOpacity>

        <BottomSheet
          isVisible={showCollectionChooser}
          containerStyle={CommonStyles.bottomSheetContainerStyle}>
          <ListItem key='0' containerStyle={CommonStyles.bottomSheetTitleStyle}>
            <ListItem.Content>
              <ListItem.Title style={[CommonStyles.bottomSheetItemTextStyle, CommonStyles.defaultText]}>Collection à afficher</ListItem.Title>
            </ListItem.Content>
          </ListItem>
          {Object.entries(collectionGenres).map(([mode, title], index) => (
            <ListItem key={index + 1}
              containerStyle={collectionGenre == mode ? CommonStyles.bottomSheetSelectedItemContainerStyle : CommonStyles.bottomSheetItemContainerStyle}
              onPress={() => onCollectionGenreChanged(route, navigation, mode) }>
              <ListItem.Content>
                <ListItem.Title style={collectionGenre == mode ? CommonStyles.bottomSheetSelectedItemTextStyle : CommonStyles.bottomSheetItemTextStyle}>
                  {title[0]}
                </ListItem.Title>
              </ListItem.Content>
            </ListItem>
          ))}
        </BottomSheet>
      </View>
    );
  }

  const onSettingsPress = (navigation) => {
    navigation.navigate('Settings');
  };

  return (
    <CollectionStack.Navigator screenOptions={defaultStackOptions}>
      <CollectionStack.Screen name='Ma collection'
        component={CollectionScreen}
        options={({ route }) => {
          route.params = { collectionGenre: collectionGenre };
          return {
            headerLeft: () => accountButton(navigation),
            headerRight: () => settingsButton(route, navigation),
          };
        }} />
      <CollectionStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({ title: route.params.item.NOM_SERIE })} />
      <CollectionStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareButton(route.params.item)
        })} />
      <CollectionStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({ title: route.params.item.PSEUDO })} />
    </CollectionStack.Navigator>
  );
}

function WishlistScreens({ navigation }) {
  return (
    <WishlistStack.Navigator screenOptions={defaultStackOptions}>
      <WishlistStack.Screen name='Mes envies BD' component={WishlistScreen} />
      <WishlistStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({ title: route.params.item.NOM_SERIE })} />
      <WishlistStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareButton(route.params.item)
        })} />
      <WishlistStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({ title: route.params.item.PSEUDO })} />
    </WishlistStack.Navigator>
  );
}

function ToCompleteScreens({ navigation }) {
  return (
    <ToCompleteStack.Navigator screenOptions={defaultStackOptions}>
      <ToCompleteStack.Screen name='Albums manquants' component={ToCompleteScreen} />
      <ToCompleteStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({ title: route.params.item.NOM_SERIE })} />
      <ToCompleteStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareButton(route.params.item)
        })} />
      <ToCompleteStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({ title: route.params.item.PSEUDO })} />
    </ToCompleteStack.Navigator>
  );
}

function NewsScreens({ navigation }) {
  return (
    <NewsStack.Navigator screenOptions={defaultStackOptions}>
      <NewsStack.Screen name='Actualité' component={NewsScreen} />
      <NewsStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareButton(route.params.item)
        })} />
      <NewsStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({ title: route.params.item.NOM_SERIE })} />
      <NewsStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({ title: route.params.item.PSEUDO })} />
    </NewsStack.Navigator>
  );
}

function SearchScreens({ navigation }) {
  return (
    <SearchStack.Navigator screenOptions={defaultStackOptions}>
      <SearchStack.Screen name='Rechercher' component={SearchScreen} />
      <SearchStack.Screen name='Serie' component={SerieScreen}
        options={({ route }) => ({ title: route.params.item.NOM_SERIE })} />
      <SearchStack.Screen name='Album' component={AlbumScreen}
        options={({ route }) => ({
          title: route.params.item.TITRE_TOME,
          headerRight: () => shareButton(route.params.item)
        })} />
      <SearchStack.Screen name='Auteur' component={AuteurScreen}
        options={({ route }) => ({ title: route.params.item.PSEUDO })} />
      <SearchStack.Screen name='BarcodeScanner' component={BarcodeScanner}
        options={({ title: 'Scan code-barre' })} />
    </SearchStack.Navigator>
  );
}

function MainTab2() {

  const setTabBarIonicons = (icon, params) => {
    return (
      <Ionicons name={icon} color={params.color} size={params.size} />
    );
  };

  const setTabBarMatComIcons = (icon, params) => {
    return (
      <MaterialCommunityIcons name={icon} color={params.color} size={params.size} />
    );
  };

  const setTabBarMatIcons = (icon, params) => {
    return (
      <MaterialIcons name={icon} color={params.color} size={params.size} />
    );
  };

  return (
    <Tab.Navigator
      initialRouteName='Ma collection'
      screenOptions={{ gestureEnabled: false }}
      tabBarOptions={{ activeTintColor: bdovored }}
      animationEnabled={true}
    >
      <Tab.Screen
        name='Wishlist'
        component={WishlistScreens}
        options={{
          tabBarIcon: (p) => {
            return setTabBarMatComIcons('heart', p);
          }
        }}
      />
      <Tab.Screen
        name='A compléter'
        component={ToCompleteScreens}
        options={{
          tabBarIcon: (p) => {
            return setTabBarMatIcons('list-alt', p);
          }
        }}
      />
      <Tab.Screen
        name='Ma collection'
        component={CollectionScreens}
        options={{
          tabBarIcon: (p) => {
            return setTabBarMatComIcons('home', p);
          }
        }}
      />
      <Tab.Screen
        name='Actualité'
        component={NewsScreens}
        options={{
          tabBarIcon: (p) => {
            return setTabBarMatIcons('fiber-new', p);
          }
        }}
      />
      <Tab.Screen
        name='Rechercher'
        component={SearchScreens}
        options={{
          tabBarIcon: (p) => {
            return setTabBarMatIcons('search', p);
          }
        }}
      />
    </Tab.Navigator>
  );
}

const RootStack = createStackNavigator();

function MainTab() {
  return (
    <RootStack.Navigator mode="modal" headerMode="none">
      <RootStack.Screen name="MainTab2" component={MainTab2} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Settings" component={SettingsScreen} />
      <RootStack.Screen name="Image" component={ImageScreen} />
    </RootStack.Navigator>
  );
}

export default MainTab;
