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
import { SectionList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import CollectionManager from '../api/CollectionManager';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';

import { AlbumItem } from '../components/AlbumItem';
import { AuteurItem } from '../components/AuteurItem';
import { CommonStyles } from '../styles/CommonStyles';
import { SmallLoadingIndicator } from '../components/SmallLoadingIndicator';


function AuteurScreen({ route, navigation }) {

  const [auteurAlbums, setAuteurAlbums] = useState([]);
  const [errortext, setErrortext] = useState('');
  const [item, setItem] = useState(route.params.item);
  const [loading, setLoading] = useState(false);
  const [nbAlbums, setNbAlbums] = useState(-1);
  const [nbSeries, setNbSeries] = useState(-1);

  useEffect(() => {
    refreshDataIfNeeded();
  }, []);

  useFocusEffect(useCallback(() => {
    CollectionManager.refreshAlbumSeries(auteurAlbums);
  }, [auteurAlbums]));

  const refreshDataIfNeeded = async () => {
    console.debug("refresh author data");
    fetchData();
  }

  const fetchData = () => {
    setLoading(true);
    setAuteurAlbums([]);
    setNbSeries(-1);
    setNbAlbums(-1);
    setErrortext('');
    if (global.verbose) {
      Helpers.showToast(false, 'Téléchargement de la fiche auteur...');
    }
    APIManager.fetchAlbum(onAuteurAlbumsFetched, { id_auteur: item.ID_AUTEUR });
  }

  const onAuteurAlbumsFetched = async (result) => {
    console.debug("author albums fetched");

    // Sort the albums by serie by putting them in a dictionnary of series
    let data = result.items;
    let albums = {};
    data.forEach(album => {
      var key = album.NOM_SERIE;
      if (key in albums) {
        albums[key].data.push(album);
      } else {
        albums[key] = { title: album.NOM_SERIE, data: [album] };
      }
    });

    // Sort the series dictionnary by name
    const sortObjectByKeys = (o) => {
      return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
    }
    albums = sortObjectByKeys(albums);

    // Sort each series by tome number
    const albumsArray = Object.values(albums);
    albumsArray.forEach(album => {
      Helpers.sortByAscendingValue(album.data, 'NUM_TOME');
    });

    CollectionManager.refreshAlbumSeries(albumsArray);

    setAuteurAlbums(albumsArray);
    setNbSeries(albumsArray.length);
    setNbAlbums(result.totalItems);
    setErrortext(result.error);
    setLoading(false);
  }

  const renderAlbum = ({ item, index }) =>
    Helpers.isValid(item) &&
    <AlbumItem navigation={navigation} item={Helpers.toDict(item)} index={index} dontShowSerieScreen={true} />;

  const keyExtractor = useCallback((item, index) =>
    Helpers.isValid(item) ? Helpers.makeAlbumUID(item) : index);

  return (
    <View style={CommonStyles.screenStyle}>
      <View>
        <AuteurItem navigation={navigation} item={item} nbAlbums={nbAlbums} nbSeries={nbSeries} noPressAction={true} canViewFullscreenImage={true} showId={true} />
        {loading ? <SmallLoadingIndicator /> : null}
      </View>
      {errortext ? (
        <Text style={CommonStyles.errorTextStyle}>
          {errortext}
        </Text>
      ) : null}
      <SectionList
        style={{ flex: 1, marginHorizontal: 1 }}
        maxToRenderPerBatch={6}
        windowSize={10}
        sections={auteurAlbums}
        keyExtractor={keyExtractor}
        renderItem={renderAlbum}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[CommonStyles.sectionStyle, CommonStyles.sectionTextStyle]} numberOfLines={1} textBreakStrategy='balanced'>{title}</Text>)}
        stickySectionHeadersEnabled={true}
        ItemSeparatorComponent={Helpers.renderSeparator}
      />
    </View>
  );
}

export default AuteurScreen;
