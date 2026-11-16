// Wycięte z MWL_THT v6.3.4 (Ver_5_0/src/SomaMqttClient.cpp) – dekodowanie binarnych zmiennych
// Dat_Acstc.AcousticState i Dat_Acstc.ActiveRequests (typ SOMA 0x2C) na tekst przekazywany do gry.

template <typename T>
T rd( const QByteArray& b, int off ) {
  return qFromLittleEndian<T>( reinterpret_cast<const uchar*>( b.constData() + off ) );
}

// Dat_Acstc.AcousticState (typ 0x2C): [len][guid 16 B][dataLen][k] potem k x ([zrodlo][n][n x wyjscie]).
// Wynik tekstowy "zrodlo:wyj,wyj;..." np. "4:3,5" (ogloszenie kierowcy na glosniki wewn.+zewn.), "" = cisza.
QVariant decodeAcousticState( const QByteArray& raw ) {
  QByteArray p = raw;
  if ( !p.isEmpty() && std::all_of( p.begin(), p.end(), []( char c ) { return std::isxdigit( uchar( c ) ) || c == ' '; } ) )
    p = QByteArray::fromHex( p );
  if ( p.size() < 40 || rd<quint32>( p, 8 ) != 0x2C ) return {};
  int o = 12 + 24;
  const quint32 k = rd<quint32>( p, o ); o += 4;
  QStringList reqs;
  for ( quint32 i = 0; i < k && i < 16 && o + 8 <= p.size(); ++i ) {
    const quint32 src = rd<quint32>( p, o ), n = rd<quint32>( p, o + 4 ); o += 8;
    QStringList outs;
    for ( quint32 j = 0; j < n && j < 32 && o + 4 <= p.size(); ++j, o += 4 ) outs << QString::number( rd<quint32>( p, o ) );
    reqs << QString::number( src ) + ":" + outs.join( ',' );
  }
  return reqs.join( ';' );
}

// Dat_Acstc.ActiveRequests (typ 0x2C): [len][guid 16 B][dataLen][k] potem k x [id zadania].
// Wynik "id,id", np. "13" (ogloszenie kierowcy), "34" (zapowiedz przystanku), "7" (CC), "" = brak.
QVariant decodeActiveRequests( const QByteArray& raw ) {
  QByteArray p = raw;
  if ( !p.isEmpty() && std::all_of( p.begin(), p.end(), []( char c ) { return std::isxdigit( uchar( c ) ) || c == ' '; } ) )
    p = QByteArray::fromHex( p );
  if ( p.size() < 40 || rd<quint32>( p, 8 ) != 0x2C ) return {};
  const quint32 k = rd<quint32>( p, 36 );
  QStringList ids;
  for ( quint32 i = 0; i < k && i < 16 && 40 + int( i ) * 4 + 4 <= p.size(); ++i ) ids << QString::number( rd<quint32>( p, 40 + int( i ) * 4 ) );
  return ids.join( ',' );
}

// w handlePublish():
  const QVariant v = name == QLatin1String( "Dat_Acstc.AcousticState" )  ? decodeAcousticState( packet.mid( ps ) )
                  : name == QLatin1String( "Dat_Acstc.ActiveRequests" ) ? decodeActiveRequests( packet.mid( ps ) )
                                                                          : decodeValue( packet.mid( ps ) );

// TramLiveWindow::pushState() – przekazanie do JS:
//   put( "acstc", "Dat_Acstc.AcousticState" );
//   put( "acreq", "Dat_Acstc.ActiveRequests" );
//   put( "ccStt", "CntrlCntrVcCnnStt" );  put( "ccKind", "CntrlCntrVcCnnKnd" );  put( "voice", "Dat_Radio.VoiceConStatus" );
