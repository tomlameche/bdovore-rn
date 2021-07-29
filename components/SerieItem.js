import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Image, Rating } from 'react-native-elements';

import CommonStyles from '../styles/CommonStyles';
import * as APIManager from '../api/APIManager';
import { CoverImage } from './CoverImage';

const onPressSerie = (navigation, item) => {
  navigation.push('Serie', { item });
}

export function SerieItem({ navigation, item, index }) {

  return (
    <TouchableOpacity key={index} onPress={() => onPressSerie(navigation, item)}>
      <View style={{ flexDirection: 'row' }}>
        <CoverImage source={APIManager.getSerieCoverURL(item)} />
        <View style={CommonStyles.itemTextContent}>
          <Text style={[CommonStyles.itemTextWidth, CommonStyles.bold]}>{item.NOM_SERIE}</Text>
          <Text>{item.NOM_GENRE}</Text>
          {(item.NB_USER_ALBUM) ? (<Text style={[CommonStyles.itemTextWidth, CommonStyles.italic]}>
            {item.NB_USER_ALBUM} album{item.NB_USER_ALBUM > 1 ? 's' : ''} sur {item.NB_ALBUM} dans la base {'\n'}
            {item.LIB_FLG_FINI_SERIE}
          </Text>) : null}
          {(item.NOTE_SERIE) ?
            <View style={{ marginTop: 5, height: 20, alignItems: 'baseline' }}>
              <Rating
                ratingCount={5}
                imageSize={20}
                startingValue={(item.NOTE_SERIE) / 2}
                tintColor='#fff'
                readonly={true}
              />
            </View>
          : null}
        </View>
      </View>
    </TouchableOpacity >
  );
}
