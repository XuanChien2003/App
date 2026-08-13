import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { getScanHistory } from '../api/scans';

const PAGE_SIZE = 20;

export function HistoryScreen() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (targetPage, append) => {
    try {
      const res = await getScanHistory({ page: targetPage, limit: PAGE_SIZE });
      setTotal(res.total);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
      setPage(targetPage);
      setError('');
    } catch (err) {
      setError(err.message || 'Không tải được lịch sử quét');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(1, false).finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(1, false);
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    await load(page + 1, true);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="history-screen">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.order?.internalCode || 'x'}-${item.eventTime}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có lượt quét nào</Text>}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowCode}>{item.order?.internalCode || '-'}</Text>
              <Text style={styles.rowType}>{item.eventType}</Text>
            </View>
            <Text style={styles.rowSub}>{item.order?.receiverName || ''}</Text>
            <Text style={styles.rowTime}>{new Date(item.eventTime).toLocaleString('vi-VN')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  empty: { textAlign: 'center', color: '#616e7c', marginTop: 40 },
  error: { color: '#dc2626', backgroundColor: '#fee2e2', padding: 10, margin: 12, borderRadius: 8, fontSize: 13 },
  row: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  rowCode: { fontWeight: '700', fontSize: 14, color: '#1f2933' },
  rowType: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  rowSub: { fontSize: 13, color: '#616e7c', marginTop: 2 },
  rowTime: { fontSize: 12, color: '#9aa5b1', marginTop: 6 },
});
