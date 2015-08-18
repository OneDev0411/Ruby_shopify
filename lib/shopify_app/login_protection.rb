module ShopifyApp
  module LoginProtection
    extend ActiveSupport::Concern

    included do
      rescue_from ActiveResource::UnauthorizedAccess, :with => :close_session
    end

    def shopify_session
      if shop_session
        begin
          ShopifyAPI::Base.activate_session(shop_session)
          yield
        ensure
          ShopifyAPI::Base.clear_session
        end
      else
        redirect_to_login
      end
    end

    def shop_session
      return unless session[:shopify]
      @shop_session ||= ShopifyApp::SessionRepository.retrieve(session[:shopify])
    end

    def login_again_if_different_shop
      if shop_session && params[:shop] && params[:shop].is_a?(String) && shop_session.url != params[:shop]
        session[:shopify] = nil
        session[:shopify_domain] = nil
        redirect_to_login
      end
    end

    protected

    def redirect_to_login
      if request.xhr?
        head :unauthorized
      else
        session[:return_to] = request.fullpath if request.get?
        redirect_to login_path(shop: params[:shop])
      end
    end

    def close_session
      session[:shopify] = nil
      session[:shopify_domain] = nil
      redirect_to login_path
    end

    def login_path(params = {})
      main_app.login_path(params)
    rescue NoMethodError => e
      shopify_app.login_path(params)
    end

  end
end
