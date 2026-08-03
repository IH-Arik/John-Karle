import { ScaledSheet } from 'react-native-size-matters';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  primary: '#97a98b',
  textPrimary: '#FFFFFF',
  textAccent: '#b8c6a7',
  textDescription: '#d0d0d0',
  darkOverlay: 'rgba(0, 0, 0, 0.6)',
};

export const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slideImage: {
    width: width,
    height: height,
  },
  safeArea: {
    flex: 1,
  },
  topControls: {
    height: '50@vs',
    alignItems: 'flex-end',
    paddingHorizontal: '24@ms',
    justifyContent: 'center',
  },
  skipBtn: {
    padding: '8@ms',
  },
  skipText: {
    color: COLORS.textAccent,
    fontSize: '18@ms',
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: '24@ms',
    paddingBottom: '100@vs', 
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: '6@vs',
    paddingHorizontal: '12@s',
    borderRadius: '20@ms',
    alignSelf: 'flex-start',
    marginBottom: '24@vs',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: '12@ms',
    letterSpacing: 1,
    fontFamily: 'Inter-SemiBold',
    marginLeft: '6@s',
  },
  iconBox: {
    width: '56@s',
    height: '56@s',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: '14@ms',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '24@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: '40@ms',
    lineHeight: '46@ms',
    fontFamily: 'PlayfairDisplay',
    marginBottom: '18@vs',
  },
  description: {
    fontSize: '15@ms',
    lineHeight: '22@ms',
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter',
    marginBottom: '24@vs',
  },
  listContainer: {
    marginTop: '10@vs',
    gap: '12@vs',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@s',
  },
  listIcon: {
    opacity: 0.9,
  },
  listText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '16@ms',
    fontFamily: 'Inter',
  },
  quoteCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: '20@ms',
    borderRadius: '16@ms',
    marginTop: '20@vs',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  quoteText: {
    color: '#333',
    fontSize: '15@ms',
    lineHeight: '21@ms',
    fontFamily: 'Inter',
  },
  footerArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '24@ms',
    paddingBottom: '30@vs',
    paddingTop: '10@vs',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
  },
  dot: {
    height: '8@ms',
    borderRadius: '4@ms',
    backgroundColor: COLORS.primary,
  },
  dotActive: {
    width: '24@s',
    opacity: 1,
  },
  dotInactive: {
    width: '8@s',
    opacity: 0.4,
    backgroundColor: '#FFF',
  },
  btn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '14@vs',
    paddingHorizontal: '24@s',
    borderRadius: '30@ms',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  btnText: {
    color: '#FFF',
    fontSize: '16@ms',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
