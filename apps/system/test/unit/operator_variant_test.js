'use strict';

requireApp('system/shared/test/unit/mocks/mock_icc_helper.js');
requireApp('system/shared/test/unit/mocks/mock_navigator_moz_mobile_connection.js');
requireApp('system/shared/test/unit/mocks/mock_navigator_moz_settings.js');

requireApp('system/shared/js/operator_variant_helper.js');

var mocksForOperatorVariant = new MocksHelper([
  'IccHelper'
]).init();

suite('operator variant', function() {
  const TEST_NETWORK_MCC = 1;

  const EXPECTED_DATA_MNC = 1;
  const EXPECTED_DATA_ICC_INFO = {
    mcc: TEST_NETWORK_MCC,
    mnc: EXPECTED_DATA_MNC
  };

  const EXPECTED_MMS_MNC = 2;
  const EXPECTED_MMS_ICC_INFO = {
    mcc: TEST_NETWORK_MCC,
    mnc: EXPECTED_MMS_MNC
  };

  const NULL_ICC_INFO = { mcc: 0, mnc: 0 };
  const PERSIST_KEY = 'operator_variant_test.customize';

  const DATA_KEYS_VALUES = [
    { key: 'ril.data.carrier', value: 'Test Network' },
    { key: 'ril.data.apn', value: 'internet' },
    { key: 'ril.data.user', value: 'user' },
    { key: 'ril.data.passwd', value: 'password' },
    { key: 'ril.data.httpProxyHost', value: '127.0.0.1' },
    { key: 'ril.data.httpProxyPort', value: '8080' },
    { key: 'ril.data.authtype', value: 'none' }
  ];

  const MMS_KEYS_VALUES = [
    { key: 'ril.mms.carrier', value: 'Test Network with MMS' },
    { key: 'ril.mms.apn', value: 'mms.internet' },
    { key: 'ril.mms.mmsc', value: 'http://127.0.0.1' },
    { key: 'ril.mms.mmsproxy', value: '127.0.0.1' },
    { key: 'ril.mms.mmsport', value: '8080' }
  ];

  var realMozMobileConnection;
  var realMozSettings;

  mocksForOperatorVariant.attachTestHelpers();
  suiteSetup(function() {
    MockIccHelper.mProps.cardState = 'ready';

    realMozMobileConnection = navigator.mozMobileConnection;
    navigator.mozMobileConnection = MockNavigatorMozMobileConnection;

    realMozSettings = navigator.mozSettings;
    navigator.mozSettings = MockNavigatorSettings;

    // The code being run in the anonymous function in this js file is dependent
    // on the mocks being setup properly. If we load it with the rest of the js
    // files it will always fail to run.
    requireApp('system/js/operator_variant/operator_variant.js');
  });

  suiteTeardown(function() {
    navigator.mozMobileConnection = realMozMobileConnection;
    navigator.mozSettings = realMozSettings;
  });

  setup(function() {
    MockNavigatorMozMobileConnection.iccInfo = NULL_ICC_INFO;
    MockNavigatorMozMobileConnection.triggerEventListeners('iccinfochange', {});
  });

  teardown(function() {
    MockNavigatorMozMobileConnection.iccInfo = NULL_ICC_INFO;
    MockNavigatorMozMobileConnection.triggerEventListeners('iccinfochange', {});
  });

  function setObservers(keyValues, observer, remove) {
    if (remove === undefined) {
      remove = false;
    }

    if (remove) {
      keyValues.forEach(function(data) {
        MockNavigatorSettings.removeObserver(data.key, this);
      }, observer.bound);
      observer.bound = null;
    }
    else {
      observer.bound = observer.func.bind(observer);
      keyValues.forEach(function(data) {
        MockNavigatorSettings.addObserver(data.key, this);
      }, observer.bound);
    }
  }

  test('operator variant data apn', function(done) {
    var observer = {
      bound: null,
      expected: DATA_KEYS_VALUES.length,
      seen: 0,
      func: function(event) {
        DATA_KEYS_VALUES.forEach(function(data) {
          if (data.key == event.settingName) {
            assert.equal(
              event.settingValue,
              data.value,
              'Wrong Data setting value'
            );
            ++this.seen;
          }
        }, this);

        if (this.seen == this.expected) {
          setObservers(DATA_KEYS_VALUES, this, true);
          done();
        }
      }
    };

    setObservers(DATA_KEYS_VALUES, observer);

    MockNavigatorMozMobileConnection.iccInfo = EXPECTED_DATA_ICC_INFO;
    MockNavigatorMozMobileConnection.triggerEventListeners('iccinfochange', {});
  });

  test('operator variant mms apn', function(done) {
    var observer = {
      bound: null,
      expected: MMS_KEYS_VALUES.length,
      seen: 0,
      func: function(event) {
        MMS_KEYS_VALUES.forEach(function(data) {

          if (data.key == event.settingName) {
            assert.equal(
              event.settingValue,
              data.value,
              'Wrong MMS setting value'
            );
            ++this.seen;
          }
        }, this);

        if (this.seen == this.expected) {
          setObservers(MMS_KEYS_VALUES, this, true);
          done();
        }
      }
    };

    setObservers(MMS_KEYS_VALUES, observer);

    MockNavigatorMozMobileConnection.iccInfo = EXPECTED_MMS_ICC_INFO;
    MockNavigatorMozMobileConnection.triggerEventListeners('iccinfochange', {});
  });

});