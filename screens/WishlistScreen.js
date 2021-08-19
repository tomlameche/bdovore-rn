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

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Switch, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import * as Helpers from '../api/Helpers';
import { bdovorgray, AlbumItemHeight, CommonStyles } from '../styles/CommonStyles';
import { AlbumItem } from '../components/AlbumItem';


function WishlistScreen({ navigation }) {

  const [filterByDate, setFilterByDate] = useState(true);
  const [filteredData, setFilteredData] = useState(null);

  const isFocused = useIsFocused();

  Helpers.checkForToken(navigation);

  useEffect(() => {
    // Make sure data is refreshed when screen get focus again
    const willFocusSubscription = navigation.addListener('focus', () => {
      refreshData();
    });
    return willFocusSubscription;
  }, []);

  /*useFocusEffect(useCallback(() => {
    //refreshData();
  }));*/

  useEffect(() => {
    refreshData();
  }, [filterByDate]);

  const refreshData = () => {
    setFilteredData(filterByDate ? Helpers.sliceSortByDate(global.wishlistAlbums) : null);
  }

  const toggleFilterByDate = () => {
    setFilterByDate(previousState => !previousState);
  }

  const renderItem = ({ item, index }) => {
    return AlbumItem({ navigation, item, index });
  }

  const keyExtractor = useCallback((item, index) =>
    Helpers.makeAlbumUID(item));

  return (
    <View style={CommonStyles.screenStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, backgroundColor: bdovorgray }}>
        <Text style={[{ flex: 1, margin: 5, fontSize: 16}, CommonStyles.bold, CommonStyles.largerText]}>
          {Helpers.pluralWord(filteredData ? filteredData.length : global.wishlistAlbums.length, 'album')}
        </Text>
        <View></View>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ margin: 5, fontSize: 16 }}>Tri par ajout</Text>
          <Switch value={filterByDate}
            onValueChange={toggleFilterByDate} />
        </View>
      </View>
      <FlatList
        style={{ flex: 1 }}
        maxToRenderPerBatch={6}
        windowSize={10}
        data={filteredData ? filteredData : global.wishlistAlbums}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={Helpers.renderSeparator}
        getItemLayout={(data, index) => ({
          length: AlbumItemHeight,
          offset: AlbumItemHeight * index,
          index
        })}
      />
    </View>
  );
}

export default WishlistScreen;
