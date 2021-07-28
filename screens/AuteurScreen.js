import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, SectionList, Text, View } from 'react-native';

import * as Helpers from '../api/Helpers';
import * as APIManager from '../api/APIManager';

import CommonStyles from '../styles/CommonStyles';
import { AlbumItem } from '../components/AlbumItem';
import { AuteurItem } from '../components/AuteurItem';
import { SmallLoadingIndicator } from '../components/SmallLoadingIndicator';


function AuteurScreen({ route, navigation }) {

  const [errortext, setErrortext] = useState('');
  const [loading, setLoading] = useState(false);
  const [auteurAlbums, setAuteurAlbums] = useState([]);
  const [nbSeries, setNbSeries] = useState(-1);
  const [nbAlbums, setNbAlbums] = useState(-1);
  let cachedIdAuteur = -1;

  const item = route.params.item;

  const refreshDataIfNeeded = async () => {
    console.log("refresh auteur data");
    fetchData();
  }

  useEffect(() => {
    refreshDataIfNeeded();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setAuteurAlbums([]);
    setNbSeries(-1);
    setNbAlbums(-1);
    setErrortext('');
    APIManager.fetchAlbum(onAuteurAlbumsFetched, { id_auteur: item.ID_AUTEUR});
  }

  const onAuteurAlbumsFetched = async (result) => {
    console.log("auteur albums fetched");

    // sort the albums by serie
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

    // Sort the series by name
    const sortObjectByKeys = (o) => {
      return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
    }
    albums = sortObjectByKeys(albums);

    const albumsArray = Object.values(albums);
    setAuteurAlbums(albumsArray);
    setNbSeries(albumsArray.length);
    setNbAlbums(result.totalItems);
    setErrortext(result.error);
    setLoading(false);
  }

  const renderAlbum = ({ item, index }) => {
    return AlbumItem({ navigation, item, index });
  }

  const keyExtractor = useCallback(({ item }, index) =>
    /*item ? parseInt(item.ID_TOME) : */index);

  return (
    <SafeAreaView style={CommonStyles.screenStyle}>
      <View>
        <AuteurItem item={item} nbAlbums={nbAlbums} nbSeries={nbSeries} noPressAction={true}/>
        {loading ? <SmallLoadingIndicator /> : null}
      </View>
      {errortext != '' ? (
        <Text style={CommonStyles.errorTextStyle}>
          {errortext}
        </Text>
      ) : null}
      <SectionList
        maxToRenderPerBatch={6}
        windowSize={10}
        sections={auteurAlbums}
        keyExtractor={keyExtractor}
        renderItem={renderAlbum}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[CommonStyles.sectionStyle, CommonStyles.bold, { paddingLeft: 10 }]}>{title}</Text>)}
        stickySectionHeadersEnabled={true}
      />
    </SafeAreaView >
  );
}

export default AuteurScreen;
