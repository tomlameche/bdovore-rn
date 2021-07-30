import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AirbnbRating, Rating } from 'react-native-elements';

import EStyleSheet from 'react-native-extended-stylesheet';
import CommonStyles from '../styles/CommonStyles';
import * as APIManager from '../api/APIManager';

import { CoverImage } from './CoverImage';
import { CollectionMarkers } from './CollectionMarkers';

const onPressAlbum = (navigation, item) => {
  navigation.push('Album', { item });
}

export function AlbumItem({ navigation, item, index, collectionMode }) {
  const tome = (item.NUM_TOME !== null) ? "tome " + item.NUM_TOME : '';
  return (
    <TouchableOpacity key={index} onPress={() => onPressAlbum(navigation, item)}>
      <View style={{ flexDirection: 'row', }}>
        <CoverImage source={APIManager.getAlbumCoverURL(item)} />
        <View style={CommonStyles.itemTextContent}>
          <Text style={[CommonStyles.largerText]} numberOfLines={1} textBreakStrategy='balanced'>{item.TITRE_TOME}</Text>
          <Text style={[CommonStyles.itemTextWidth, { color: 'lightgrey', marginTop: 15 }]}>
            {item.NOM_SERIE} {tome}{'\n'}
          </Text>
          {(item.MOYENNE_NOTE_TOME !== null) ?
            <View style={{ marginTop: 5, height: 20, alignItems: 'baseline' }}>
              <Rating
                ratingCount={5}
                imageSize={20}
                startingValue={(item.MOYENNE_NOTE_TOME) / 2}
                tintColor="white"
                readonly
              />
            </View>
            : null}
          {collectionMode ? null :
            <CollectionMarkers item={item} style={styles.markersStyle} reduceMode={true}/>
          }
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = EStyleSheet.create({
  markersStyle: {
    position: 'absolute',
    bottom: 0,
    right: 20,
  },
});
