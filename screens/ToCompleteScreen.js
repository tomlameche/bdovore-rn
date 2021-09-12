/* Copyright 2021 Joachim Pouderoux & Association BDovore
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

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import { useIsFocused } from '@react-navigation/native';
import { ButtonGroup } from 'react-native-elements';

import { AlbumItem } from '../components/AlbumItem';
import { bdovored, bdovorlightred, AlbumItemHeight, CommonStyles } from '../styles/CommonStyles';
import { Icon } from '../components/Icon';
import { SerieItem } from '../components/SerieItem';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';


let loadingSteps = 0;
let loadedAlbums = 0;
let loadedSeries = 0;
let collectionGenre = 0;
let albums = [];
let series = [];

function ToCompleteScreen({ route, navigation }) {

  const [collectionType, setCollectionType] = useState(0); // 0: Albums, 1: Series
  const [errortext, setErrortext] = useState('');
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nbTotalAlbums2, setNbTotalAlbums2] = useState(0);
  const [nbTotalSeries2, setNbTotalSeries2] = useState(0);
  const [progressRate, setProgressRate] = useState(0);
  const [toggleElement, setToggleElement] = useState(false);

  let [nbTotalAlbums, setNbTotalAlbums] = useState(0);
  let [nbTotalSeries, setNbTotalSeries] = useState(0);
  let [cachedToken, setCachedToken] = useState('');

  const toggle = () => {
    setToggleElement(!toggleElement);
  }

  collectionGenre = route.params.collectionGenre;

  Helpers.checkForToken(navigation);

  useEffect(() => {
    navigation.setOptions({
      title: ('Albums manquants' + (collectionGenre > 0 ? (' - ' + CollectionManager.CollectionGenres[collectionGenre][0]) : '')),
    });

    applyAlbumsFilters();
    applySeriesFilters();
  }, [collectionGenre]);

  const refreshDataIfNeeded = () => {
    if (CollectionManager.isCollectionEmpty()) {
      setNbTotalAlbums2(0);
      setNbTotalSeries2(0);
      albums = [];
      series = [];
    }

    AsyncStorage.getItem('token').then((token) => {
      if (token !== cachedToken) {
        console.debug("refresh tocomplete because token changed from " + cachedToken + ' to ' + token);
        setCachedToken(token);
        cachedToken = token;
        fetchData();
      } else if (!global.collectionManquantsUpdated) {
        fetchData();
      }
    }).catch(() => { });

    applyAlbumsFilters();
    applySeriesFilters();
  }

  const applyAlbumsFilters = () => {
    const genre = CollectionManager.CollectionGenres[collectionGenre][0];
    setFilteredAlbums(albums.filter((album) =>
      !CollectionManager.isAlbumExcluded(album) && (collectionGenre == 0 ? true : (album.ORIGINE == genre || (album.NOM_GENRE ? album.NOM_GENRE.startsWith(genre) : false)))));
  }

  const applySeriesFilters = () => {
    const genre = CollectionManager.CollectionGenres[collectionGenre][0];
    setFilteredSeries(series.filter((serie) =>
      serie.IS_EXCLU != 1 && (collectionGenre == 0 ? true : (serie.ORIGINE == genre || (serie.NOM_GENRE ? serie.NOM_GENRE.startsWith(genre) : false)))));
  }

  useEffect(() => {
    refreshDataIfNeeded();
    // Make sure data is refreshed when login/token changed
    const willFocusSubscription = navigation.addListener('focus', () => {
      refreshDataIfNeeded();
    });
    return willFocusSubscription;
  }, [cachedToken]);

  const makeProgress = (result) => {
    loadingSteps -= (result.done ? 1 : 0);
    setLoading(loadingSteps > 0);

    if (parseFloat(nbTotalAlbums) > 0 && parseFloat(nbTotalSeries) > 0) {
      const nbTotalItems = parseFloat(nbTotalAlbums) + parseFloat(nbTotalSeries);
      const rate = parseFloat(loadedAlbums + loadedSeries) / nbTotalItems;
      //console.debug(loadedAlbums + ", " + loadedSeries + " rate : " + rate + "   " + nbTotalAlbums + " , "+ nbTotalSeries);
      setProgressRate(rate);
    }
  }

  const fetchData = () => {
    if (global.isConnected) {
      if (global.verbose) {
        Helpers.showToast(false, 'Téléchargement des albums/séries manquants...');
      }
      global.collectionManquantsUpdated = true;
      setLoading(true);
      setProgressRate(0);
      loadingSteps = 2;
      setErrortext('');
      fetchSeries();
      fetchAlbums();
    }
  }

  const fetchAlbums = () => {
    albums = [];
    setNbTotalAlbums(0);
    setNbTotalAlbums2(0);
    loadedAlbums = 0;
    APIManager.fetchAlbumsManquants({ navigation: navigation }, onAlbumsFetched)
      .then().catch((error) => console.debug(error));
  }

  const onAlbumsFetched = async (result) => {
    console.debug('albums ' + (result.done ? 'done' : 'in progress'));
    console.debug(result.items.length + ' albums fetched so far');
    setNbTotalAlbums2(result.totalItems);
    nbTotalAlbums = result.totalItems;
    albums = result.items;
    setErrortext(result.error);
    loadedAlbums = result.items.length;

    applyAlbumsFilters();

    makeProgress(result);
  }

  const fetchSeries = () => {
    series = [];
    setNbTotalSeries(0);
    setNbTotalSeries2(0);
    loadedSeries = 0;
    APIManager.fetchSeriesManquants({ navigation: navigation }, onSeriesFetched)
      .then().catch((error) => console.debug(error));
  }

  const onSeriesFetched = async (result) => {
    console.debug('series ' + (result.done ? 'done' : 'in progress'));
    console.debug(result.items.length + ' series to complete fetched')
    setNbTotalSeries2(result.totalItems);
    nbTotalSeries = result.totalItems;
    series = result.items;
    setErrortext(result.error);
    loadedSeries = result.items.length;

    applySeriesFilters();

    makeProgress(result);
  }

  const onPressCollectionType = (selectedIndex) => {
    setCollectionType(parseInt(selectedIndex));
  }

  const renderItem = ({ item, index }) => {
    if (Helpers.isValid(item)) {
      switch (collectionType) {
        case 0: return (<AlbumItem navigation={navigation} item={Helpers.toDict(item)} index={index} showExclude={true} refreshCallback={toggle} />);
        case 1: return (<SerieItem navigation={navigation} item={Helpers.toDict(item)} index={index} showExclude={true} />);
      }
    }
    return null;
  }

  const keyExtractor = useCallback((item, index) =>
    Helpers.isValid(item) ?
      (item.IMG_COUV_SERIE ? item.ID_SERIE + 1000000 : Helpers.makeAlbumUID(item)) : index);

  return (
    <View style={CommonStyles.screenStyle}>
      <View style={{ flexDirection: 'row' }}>
        <ButtonGroup
          onPress={onPressCollectionType}
          selectedIndex={collectionType}
          buttons={[{
            element: () => <Text style={CommonStyles.defaultText}>
              {Helpers.pluralWord(filteredAlbums.length, 'album')}</Text>
          }, {
            element: () => <Text style={CommonStyles.defaultText}>
              {Helpers.pluralWord(filteredSeries.length, 'série')}</Text>
          }]}
          containerStyle={[{ marginLeft: 8, flex: 1 }, CommonStyles.buttonGroupContainerStyle]}
          buttonStyle={CommonStyles.buttonGroupButtonStyle}
          selectedButtonStyle={CommonStyles.buttonGroupSelectedButtonStyle}
          innerBorderStyle={CommonStyles.buttonGroupInnerBorderStyle}
        />
      </View>
      {global.isConnected ?
        <View style={{ marginHorizontal: 1 }}>
          {loading ? <Progress.Bar animated={false} progress={progressRate} width={null} color={CommonStyles.progressBarStyle.color} style={CommonStyles.progressBarStyle} /> : null}
          {errortext ? (
            <View style={{ alignItems: 'center', marginBottom: 5 }}>
              <Text style={CommonStyles.errorTextStyle}>
                {errortext}
              </Text>
            </View>
          ) : null}
          {!loading && CollectionManager.isCollectionEmpty() ?
            <View style={[CommonStyles.screenStyle, { alignItems: 'center', height: '50%', flexDirection: 'column' }]}>
              <View style={{ flex: 1 }}></View>
              <Text style={CommonStyles.defaultText}>Aucun album{CollectionManager.CollectionGenres[collectionGenre][1]} dans la collection.{'\n'}</Text>
              <Text style={CommonStyles.defaultText}>Ajoutez vos albums via les onglets Actualité, Recherche</Text>
              <Text style={CommonStyles.defaultText}>ou le scanner de codes-barres.</Text>
              <View style={{ flex: 1 }}></View>
            </View>
            :
            <FlatList
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={10}
              data={(collectionType == 0 ? filteredAlbums : filteredSeries)}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              extraData={toggleElement}
              ItemSeparatorComponent={Helpers.renderSeparator}
              getItemLayout={(data, index) => ({
                length: AlbumItemHeight,
                offset: AlbumItemHeight * index,
                index
              })}
              refreshControl={<RefreshControl
                colors={[bdovorlightred, bdovored]}
                tintColor={bdovored}
                refreshing={loading}
                onRefresh={fetchData} />}
            />}
        </View> :
        <View style={[CommonStyles.screenStyle, { alignItems: 'center', height: '50%', flexDirection: 'column' }]}>
          <View style={{ flex: 1 }}></View>
          <Text style={CommonStyles.defaultText}>Informations indisponibles en mode non-connecté.{'\n'}</Text>
          <Text style={CommonStyles.defaultText}>Rafraichissez cette page une fois connecté.</Text>
          <TouchableOpacity style={{ flexDirection: 'column', marginTop: 20 }} onPress={fetchData}>
            <Icon name='refresh' size={50} color={CommonStyles.markIconDisabled.color} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}></View>
        </View>}
    </View>
  );
}

export default ToCompleteScreen;
