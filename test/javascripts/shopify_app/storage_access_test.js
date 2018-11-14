suite('StorageAccessHelper', () => { 
  let storageAccessHelper;
  const redirectInfoStub = {
    hasStorageAccessUrl: 'https://hasStorageAccess.com',
    doesNotHaveStorageAccessUrl: 'https://doesNotHaveStorageAccess.com',
    myShopifyUrl: 'https://shop1.myshopify.io',
    home: 'https://app.io',
  };

  let contentContainer;
  let button;
  let redirectStub;

  setup(() => {
    window.parent.postMessage = sinon.stub();

    contentContainer = document.createElement('div');
    button = document.createElement('button');

    contentContainer.setAttribute('id', 'RequestStorageAccess');
    button.setAttribute('id', 'TriggerAllowCookiesPrompt');
    button.setAttribute('type', 'button');

    contentContainer.appendChild(button);
    document.body.appendChild(contentContainer);
    storageAccessHelper = new StorageAccessHelper(redirectInfoStub);
    redirectStub = sinon.stub(ITPHelper.prototype, 'redirect');
  });

  teardown(() => {
    document.body.removeChild(contentContainer);
    redirectStub.restore();
  });

  suite('execute', () => {
    test('calls setUpCookiePartitioning if ITPHelper.canPartitionCookies returns true', () => {
      var canPartitionCookiesStub = sinon.stub(ITPHelper.prototype, 'canPartitionCookies').callsFake(() => true);

      const setUpCookiePartitioningStub = sinon.stub(storageAccessHelper, 'setUpCookiePartitioning');

      storageAccessHelper.execute();

      sinon.assert.called(setUpCookiePartitioningStub);

      canPartitionCookiesStub.restore();
      setUpCookiePartitioningStub.restore();
    });

    test('calls redirectToAppHome instead of manageStorageAccess or setUpCookiePartitioningStub if ITPHelper.userAgentIsAffected returns true', async () => {
      var userAgentIsAffectedStub = sinon.stub(ITPHelper.prototype, 'userAgentIsAffected').callsFake(() => false);

      const manageStorageAccessStub = sinon.stub(storageAccessHelper, 'manageStorageAccess').callsFake(() => true);

      const redirectToAppHomeStub = sinon.stub(storageAccessHelper, 'redirectToAppHome');
      const setUpCookiePartitioningStub = sinon.stub(storageAccessHelper, 'setUpCookiePartitioning');

      storageAccessHelper.execute();

      sinon.assert.notCalled(manageStorageAccessStub);
      sinon.assert.called(redirectToAppHomeStub);
      sinon.assert.notCalled(setUpCookiePartitioningStub);

      userAgentIsAffectedStub.restore();
      manageStorageAccessStub.restore();
      redirectToAppHomeStub.restore();
      setUpCookiePartitioningStub.restore();
    });

    test('calls manageStorageAccess instead of redirectToAppHome if ITPHelper.userAgentIsAffected returns true', async () => {
      var userAgentIsAffectedStub = sinon.stub(ITPHelper.prototype, 'userAgentIsAffected').callsFake(() => true);

      const manageStorageAccessStub = sinon.stub(storageAccessHelper, 'manageStorageAccess').callsFake(() => true);

      const redirectToAppHomeStub = sinon.stub(storageAccessHelper, 'redirectToAppHome');
      const setUpCookiePartitioningStub = sinon.stub(storageAccessHelper, 'setUpCookiePartitioning');

      storageAccessHelper.execute();

      sinon.assert.called(manageStorageAccessStub);
      sinon.assert.notCalled(redirectToAppHomeStub);
      sinon.assert.notCalled(setUpCookiePartitioningStub);

      userAgentIsAffectedStub.restore();
      manageStorageAccessStub.restore();
      redirectToAppHomeStub.restore();
      setUpCookiePartitioningStub.restore();
    });
  });

  suite('manageStorageAccess', () => {
    test('calls handleHasStorageAccess instead of handleGetStorageAccess if document.hasStorageAccess returns true', async () => {
      document.hasStorageAccess = () => {
        return new Promise((resolve) => {
          resolve(true);
        });
      };

      const handleGetStorageAccessSpy = sinon.stub(storageAccessHelper, 'handleGetStorageAccess');
      const handleHasStorageAccessSpy = sinon.stub(storageAccessHelper, 'handleHasStorageAccess');

      storageAccessHelper.manageStorageAccess().then(() => {
        sinon.assert.called(handleHasStorageAccessSpy);
        sinon.assert.notCalled(handleGetStorageAccessSpy);

        handleHasStorageAccessSpy.restore();
        handleGetStorageAccessSpy.restore();
      });
    });

    test('calls handleGetStorageAccess instead of handleHasStorageAccess if document.hasStorageAccess returns false', async () => {
      document.hasStorageAccess = () => {
        return new Promise((resolve) => {
          resolve(false);
        });
      };

      const handleGetStorageAccessSpy = sinon.stub(storageAccessHelper, 'handleGetStorageAccess');
      const handleHasStorageAccessSpy = sinon.stub(storageAccessHelper, 'handleHasStorageAccess');

      storageAccessHelper.manageStorageAccess().then(() => { 
        sinon.assert.called(handleGetStorageAccessSpy);
        sinon.assert.notCalled(handleHasStorageAccessSpy);

        handleHasStorageAccessSpy.restore();
        handleGetStorageAccessSpy.restore();
      });
    });
  });

  suite('handleGetStorageAccess', () => {
    test('calls setupRequestStorageAccess instead of redirectToAppTLD if shopify.top_level_interaction is defined in sessionStorage', () => {
      const setupRequestStorageAccessSpy = sinon.stub(storageAccessHelper, 'setupRequestStorageAccess');
      const redirectToAppTLDSpy = sinon.stub(storageAccessHelper, 'redirectToAppTLD');

      sessionStorage.setItem('shopify.top_level_interaction', 'true');

      storageAccessHelper.handleGetStorageAccess();

      sinon.assert.called(setupRequestStorageAccessSpy);
      sinon.assert.notCalled(redirectToAppTLDSpy);

      setupRequestStorageAccessSpy.restore();
      redirectToAppTLDSpy.restore();
    });

    test('calls redirectToAppTLD instead of setupRequestStorageAccess if shopify.top_level_interaction is defined in sessionStorage', () => {
      const setupRequestStorageAccessSpy = sinon.stub(storageAccessHelper, 'setupRequestStorageAccess');
      const redirectToAppTLDSpy = sinon.stub(storageAccessHelper, 'redirectToAppTLD');

      sessionStorage.removeItem('shopify.top_level_interaction');

      storageAccessHelper.handleGetStorageAccess();

      sinon.assert.notCalled(setupRequestStorageAccessSpy);
      sinon.assert.called(redirectToAppTLDSpy);

      setupRequestStorageAccessSpy.restore();
      redirectToAppTLDSpy.restore();
    });
  });

  suite('setupRequestStorageAccess', () => {
    test('adds an event listener to the expected button that calls requestStorageAccess on click', () => {
      document.requestStorageAccess = () => {
        return new Promise((resolve) => {
          resolve(true);
        });
      };

      const handleRequestStorageAccessSpy = sinon.spy(storageAccessHelper, 'handleRequestStorageAccess');

      storageAccessHelper.setupRequestStorageAccess();
      button = document.querySelector('#TriggerAllowCookiesPrompt');
      button.click();

      sinon.assert.called(handleRequestStorageAccessSpy);
      handleRequestStorageAccessSpy.restore();
    });

    test('sets display property of the expected node to "block"', () => {
      storageAccessHelper.setupRequestStorageAccess();
      contentContainer = document.querySelector('#RequestStorageAccess');
      sinon.assert.match(contentContainer.style.display, 'block');
    });
  });

  suite('handleRequestStorageAccess', () => {
    test('calls redirectToAppHome instead of redirectToAppsIndex when document.requestStorageAccess resolves', () => {
      document.requestStorageAccess = () => {
        return new Promise((resolve) => {
          resolve();
        });
      };

      const redirectToAppHomeStub = sinon.stub(storageAccessHelper, 'redirectToAppHome');
      const redirectToAppsIndexStub = sinon.stub(storageAccessHelper, 'redirectToAppsIndex');

      storageAccessHelper.handleRequestStorageAccess().then(() => {
        sinon.assert.called(redirectToAppHomeStub);
        sinon.assert.notCalled(redirectToAppsIndexStub);

        redirectToAppHomeStub.restore();
        redirectToAppsIndexStub.restore();
      });
    });

    test('calls redirectToAppsIndex with "access denied" instead of calling redirectToAppHome when document.requestStorageAccess fails', () => {
      document.requestStorageAccess = () => {
        return new Promise((resolve, reject) => {
          reject();
        });
      };

      const redirectToAppHomeStub = sinon.stub(storageAccessHelper, 'redirectToAppHome');
      const redirectToAppsIndexStub = sinon.stub(storageAccessHelper, 'redirectToAppsIndex');

      storageAccessHelper.handleRequestStorageAccess().then(() => {
        sinon.assert.notCalled(redirectToAppHomeStub);
        sinon.assert.calledWith(redirectToAppsIndexStub, 'access denied');

        redirectToAppHomeStub.restore();
        redirectToAppsIndexStub.restore();
      });
    });
  });

  suite('redirectToAppHome', () => {
    test('sets "shopify.granted_storage_access" in sessionStorage', () => {
      storageAccessHelper.redirectToAppHome();
      sinon.assert.match(sessionStorage.getItem('shopify.granted_storage_access'), 'true');
    });
  });

  suite('setNormalizedLink', () => {
    test('returns redirectInfo.hasStorageAccessUrl if storage access is granted', () => {
      const link = storageAccessHelper.setNormalizedLink('access granted');
      sinon.assert.match(link, redirectInfoStub.hasStorageAccessUrl);
    });

    test('returns redirectInfo.doesNotHaveStorageAccessUrl if storage access is denied', () => {
      const link = storageAccessHelper.setNormalizedLink('access denied');
      sinon.assert.match(link, redirectInfoStub.doesNotHaveStorageAccessUrl);
    });
  });

  suite('setUpCookiePartitioning', () => {
    test('sets the display property of the #CookiePartitionPrompt node to "block"', () => {
      const node = document.createElement('div');
      node.id = 'CookiePartitionPrompt';
      node.style.display = 'none';

      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'AcceptCookies';
      
      node.appendChild(button);
      document.body.appendChild(node);

      storageAccessHelper.setUpCookiePartitioning();

      sinon.assert.match(node.style.display, 'block');

      document.body.removeChild(node);
    });

    test('adds an event listener to the #AcceptCookies button that calls setCookieAndRedirect on click', () => {
      const node = document.createElement('div');
      node.id = 'CookiePartitionPrompt';
      node.style.display = 'none';

      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'AcceptCookies';
      
      node.appendChild(button);
      document.body.appendChild(node);

      const setCookieAndRedirectStub = sinon.stub(storageAccessHelper, 'setCookieAndRedirect');

      storageAccessHelper.setUpCookiePartitioning();

      button.click();
      sinon.assert.called(setCookieAndRedirectStub);

      document.body.removeChild(node);
      setCookieAndRedirectStub.restore();
    });
  });
  
  suite('setCookieAndRedirect', () => {
    test('sets the shopify.cookies_persist cookie', () => {
      storageAccessHelper.setCookieAndRedirect();
      sinon.assert.match(document.cookie.match('shopify.cookies_persist').length, 1);
    });
  });

  suite('setUpHelper', () => {
    test('passes the correct redirectUrl to the ITPHelper constructor', () => {
      window.shopOrigin = 'https://test-shop.myshopify.io';
      window.apiKey = '123';
      
      const itpHelper = storageAccessHelper.setUpHelper();
      sinon.assert.match(itpHelper.redirectUrl, 'https://test-shop.myshopify.io/admin/apps/123');
    })
  });
});
