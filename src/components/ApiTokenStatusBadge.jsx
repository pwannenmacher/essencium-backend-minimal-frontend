import { Badge } from '@mantine/core';
import PropTypes from 'prop-types';
import { API_TOKEN_STATUS } from '../constants';
import { formatDate, formatDateTime, isExpired } from '../utils/format';

const activeBadge = (apiToken) => {
  if (isExpired(apiToken.validUntil)) {
    return <Badge color="red">Abgelaufen ({formatDate(apiToken.validUntil)})</Badge>;
  }
  return <Badge color="green">Aktiv bis {formatDate(apiToken.validUntil)}</Badge>;
};

/**
 * Status-Badge eines API-Tokens (zuvor wortgleich in ApiTokenList und
 * ApiTokenAdminList dupliziert).
 */
export default function ApiTokenStatusBadge({ apiToken }) {
  const { status } = apiToken;

  if (!status || status === API_TOKEN_STATUS.ACTIVE) {
    return activeBadge(apiToken);
  }

  switch (status) {
    case API_TOKEN_STATUS.REVOKED:
      return <Badge color="gray">Widerrufen ({formatDateTime(apiToken.updatedAt)})</Badge>;

    case API_TOKEN_STATUS.REVOKED_ROLE_CHANGED:
      return (
        <Badge color="orange">
          Widerrufen (Rolle geändert, {formatDateTime(apiToken.updatedAt)})
        </Badge>
      );

    case API_TOKEN_STATUS.REVOKED_RIGHTS_CHANGED:
      return (
        <Badge color="orange">
          Widerrufen (Rechte geändert, {formatDateTime(apiToken.updatedAt)})
        </Badge>
      );

    case API_TOKEN_STATUS.REVOKED_USER_CHANGED:
      return (
        <Badge color="orange">
          Widerrufen (Nutzer geändert, {formatDateTime(apiToken.updatedAt)})
        </Badge>
      );

    case API_TOKEN_STATUS.EXPIRED:
      return <Badge color="red">Abgelaufen</Badge>;

    case API_TOKEN_STATUS.USER_DELETED:
      return <Badge color="red">Nutzer gelöscht</Badge>;

    default:
      return <Badge color="gray">{status}</Badge>;
  }
}

ApiTokenStatusBadge.propTypes = {
  apiToken: PropTypes.shape({
    status: PropTypes.string,
    validUntil: PropTypes.string,
    updatedAt: PropTypes.string,
  }).isRequired,
};
