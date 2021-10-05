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
import { FlatList, Text, TouchableOpacity, View } from 'react-native'

import { CommonStyles, bdovorgray, windowWidth } from '../styles/CommonStyles';
import { CoverImage } from '../components/CoverImage';
import { RatingStars } from '../components/RatingStars';
import * as APIManager from '../api/APIManager';
import * as Helpers from '../api/Helpers';
import CollectionManager from '../api/CollectionManager';
import { ScrollView } from 'react-native-gesture-handler';
import { ScreenWidth } from 'react-native-elements/dist/helpers';


function CommentsScreen({ route, navigation }) {

  const [comments, setComments] = useState([]);
  const [errortext, setErrortext] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Make sure data is refreshed when login/token changed
    const willFocusSubscription = navigation.addListener('focus', () => {
      fetchData();
    });
    return willFocusSubscription;
  }, []);

  const fetchData = () => {
    if (global.isConnected) {
      if (global.verbose) {
        Helpers.showToast(false, 'Téléchargement des commentaires...');
      }
      setLoading(true);
      setErrortext('');
      fetchComments();
    }
  }

  const fetchComments = () => {
    setComments([]);
    APIManager.fetchAlbumComments(null, onCommentsFetched)
      .then().catch((error) => console.debug(error));
  }

  const onCommentsFetched = async (result) => {
    console.debug(result.items.length + ' series to complete fetched')
    setComments(result.items);
    setErrortext(result.error);
  }

  const onAlbumPress = (item) => {
    const colAlb = CollectionManager.getAlbumInCollection(item);
    if (colAlb) {
      navigation.push('Album', { item: colAlb });
    } else if (global.isConnected) {
      APIManager.fetchAlbum((result) => {
        if (result.error == '' && result.items.length > 0) {
          navigation.push('Album', { item: result.items[0] })
        } else {
          Alert.alert(
            "Album introuvable !");
        }
      }, { id_tome: item.ID_TOME, id_serie: item.ID_SERIE });
    }
  }

  const onSeriePress = (item) => {
    if (global.isConnected) {
      setLoading(true);
      APIManager.fetchSerie(item.ID_SERIE, (result) => {
        setLoading(false);
        if (result.error == '') {
          navigation.push('Serie', { item: result.items[0] });
        }
      });
    } else {
      const serie = CollectionManager.getSerieInCollection(item.ID_SERIE);
      if (serie) {
        navigation.push('Serie', { item: Helpers.toDict(serie) });
      }
    }
  }

  const getItemLayout = useCallback((data, index) => ({
    length: windowWidth,
    offset: windowWidth * index,
    index
  }), []);

  const getCommentDate = (item) => {
    if (!item.DTE_POST) { return ''; }
    const date = item.DTE_POST.split(' ');
    return 'le ' + Helpers.convertDate(date[0]) + ' à ' + date[1].substring(0, 5);
  }

  const renderComment = useCallback(({ item, index }) => (
    <ScrollView key={index} style={{ flex: 1, width: '80%', marginTop: 10, marginBottom: 10 }}>
      <View style={{ flexDirection: 'column', alignContent: 'center', alignItems: 'center', width: '100%' }}>
        <TouchableOpacity style={{ flexDirection: 'column', alignContent: 'center', alignItems: 'center', width: '100%' }} onPress={() => onAlbumPress(item)} title={item.TITRE_TOME}>
          <CoverImage item={item} category={1} style={CommonStyles.fullAlbumImageStyle} />
          <Text numberOfLines={1} textBreakStrategy='balanced' style={[CommonStyles.defaultTextStyle, CommonStyles.bold, { marginTop: 10}]}>{Helpers.getAlbumName(item)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'column', alignContent: 'center', alignItems: 'center', width: '100%' }} onPress={() => onSeriePress(item)} title={item.TITRE_TOME}>
          {item.TITRE_TOME != item.NOM_SERIE ?
            <Text numberOfLines={1} textBreakStrategy='balanced' style={[CommonStyles.linkTextStyle, { marginTop: 5 }]}>{item.NOM_SERIE}</Text> :
            null}
        </TouchableOpacity>
          <RatingStars note={item.NOTE} style={{ marginLeft: -2, marginVertical: 5 }} showRate />
        <Text style={[CommonStyles.defaultTextStyle, { color: bdovorgray, marginVertical: 5 }]}>{item.username} {getCommentDate(item)}</Text>
        <TouchableOpacity activeOpacity={1}>
          <Text style={[CommonStyles.defaultTextStyle, { width: windowWidth - 20, marginHorizontal: 10 }]}>{item.COMMENT}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>), []);

  const keyExtractor = useCallback((item, index) =>
    Helpers.isValid(item) ? item.DTE_POST : index);

  return (
    <View style={CommonStyles.screenStyle}>
      <FlatList
        horizontal
        initialNumToRender={2}
        maxToRenderPerBatch={4}
        windowSize={5}
        showsHorizontalScrollIndicator={true}
        legacyImplementation={false}
        data={comments}
        renderItem={renderComment}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={Helpers.renderVerticalSeparator}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}

export default CommentsScreen;
