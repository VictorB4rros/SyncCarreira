package com.synccarreira.synccarreira_api.config.customgrant;

import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationGrantAuthenticationToken;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

public class CustomPasswordAuthenticationToken extends OAuth2AuthorizationGrantAuthenticationToken {

	private static final long serialVersionUID = 1L;
	
	private final String username;
	private final String password;
	private final Set<String> scopes;
	
	public CustomPasswordAuthenticationToken(Authentication clientPrincipal,
			@Nullable Set<String> scopes, @Nullable Map<String, Object> additionalParameters) {
		
		super(new AuthorizationGrantType("password"), clientPrincipal, additionalParameters);
		
		if (additionalParameters != null) {
			this.username = (String) additionalParameters.get("username");
			this.password = (String) additionalParameters.get("password");
		} else {
			this.username = null;
			this.password = null;
		}
		this.scopes = Collections.unmodifiableSet(
				scopes != null ? new HashSet<>(scopes) : Collections.emptySet());
	}

	public String getUsername() {
		return this.username;
	}
	
	public String getPassword() {
		return this.password;
	}

	public Set<String> getScopes() {
		return this.scopes;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj) return true;
		if (obj == null || getClass() != obj.getClass() || !super.equals(obj)) return false;
		CustomPasswordAuthenticationToken other = (CustomPasswordAuthenticationToken) obj;
		return Objects.equals(username, other.username)
				&& Objects.equals(password, other.password)
				&& Objects.equals(scopes, other.scopes);
	}

	@Override
	public int hashCode() {
		return Objects.hash(super.hashCode(), username, password, scopes);
	}
}
