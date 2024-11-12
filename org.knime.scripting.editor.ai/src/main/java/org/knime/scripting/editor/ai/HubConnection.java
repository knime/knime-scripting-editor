/*
 * ------------------------------------------------------------------------
 *
 *  Copyright by KNIME AG, Zurich, Switzerland
 *  Website: http://www.knime.com; Email: contact@knime.com
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License, Version 3, as
 *  published by the Free Software Foundation.
 *
 *  This program is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, see <http://www.gnu.org/licenses>.
 *
 *  Additional permission under GNU GPL version 3 section 7:
 *
 *  KNIME interoperates with ECLIPSE solely via ECLIPSE's plug-in APIs.
 *  Hence, KNIME and ECLIPSE are both independent programs and are not
 *  derived from each other. Should, however, the interpretation of the
 *  GNU GPL Version 3 ("License") under any applicable laws result in
 *  KNIME and ECLIPSE being a combined program, KNIME AG herewith grants
 *  you the additional permission to use and propagate KNIME together with
 *  ECLIPSE with only the license terms in place for ECLIPSE applying to
 *  ECLIPSE and the GNU GPL Version 3 applying for KNIME, provided the
 *  license terms of ECLIPSE themselves allow for the respective use and
 *  propagation of ECLIPSE together with KNIME.
 *
 *  Additional permission relating to nodes for KNIME that extend the Node
 *  Extension (and in particular that are based on subclasses of NodeModel,
 *  NodeDialog, and NodeView) and that only interoperate with KNIME through
 *  standard APIs ("Nodes"):
 *  Nodes are deemed to be separate and independent programs and to not be
 *  covered works.  Notwithstanding anything to the contrary in the
 *  License, the License does not apply to Nodes, you are not required to
 *  license Nodes under the License, and you are granted a license to
 *  prepare and propagate Nodes, in each case even if such Nodes are
 *  propagated with or for interoperation with KNIME.  The owner of a Node
 *  may freely choose the license terms applicable to such Node, including
 *  when such Node is propagated with or for interoperation with KNIME.
 * ---------------------------------------------------------------------
 *
 * History
 *   15 Sep 2023 (chaubold): created
 */
package org.knime.scripting.editor.ai;

import java.io.IOException;

import org.eclipse.core.runtime.CoreException;
import org.eclipse.core.runtime.IConfigurationElement;
import org.eclipse.core.runtime.IExtension;
import org.eclipse.core.runtime.IExtensionPoint;
import org.eclipse.core.runtime.IExtensionRegistry;
import org.eclipse.core.runtime.Platform;
import org.knime.core.node.NodeLogger;

/**
 * The {@link HubConnection} is a singleton that uses the (last) registered {@link HubEndpoint} of the extension point
 * with the same name. It shall provide access to the KNIME Hub that is currently selected in the AP to be used for AI
 * assistance.
 *
 * @author Carsten Haubold, KNIME GmbH, Konstanz, Germany
 */
public final class HubConnection implements HubEndpoint { // NOSONAR: singleton to only parse the extension point once
    private static final String EXTENSION_POINT = "org.knime.scripting.editor.ai.HubEndpoint";

    private static final String HUB_ENDPOINT = "HubEndpoint";

    private static final String HUB_ENDPOINT_CLASS = "class";

    private final HubEndpoint m_hubEndpoint;

    /** The one and only instance of the HubConnection */
    public static final HubConnection INSTANCE = new HubConnection();

    private HubConnection() {
        IExtensionRegistry registry = Platform.getExtensionRegistry();
        IExtensionPoint extPoint = registry.getExtensionPoint(EXTENSION_POINT);
        HubEndpoint hubEndpoint = null;
        for (IExtension extension : extPoint.getExtensions()) {
            for (IConfigurationElement element : extension.getConfigurationElements()) {
                if (element.getName().equals(HUB_ENDPOINT)) {
                    try {
                        hubEndpoint = (HubEndpoint)element.createExecutableExtension(HUB_ENDPOINT_CLASS);
                    } catch (CoreException ex) {
                        NodeLogger.getLogger(getClass()).error("Could not load HubEndpoint from class "
                            + element.getAttribute(HUB_ENDPOINT_CLASS) + ": " + ex);
                    }
                }
            }
        }

        m_hubEndpoint = hubEndpoint;
    }

    /**
     * @return whether a HubConnection can be established at all because an implementation has been registered against
     *         this extension point
     */
    public boolean isAvailable() {
        return m_hubEndpoint != null;
    }

    @Override
    public boolean isKaiEnabled() {
        return m_hubEndpoint.isKaiEnabled();
    }

    @Override
    public String getHubId() {
        return m_hubEndpoint.getHubId();
    }

    @Override
    public boolean loginToHub() {
        return m_hubEndpoint.loginToHub();
    }

    @Override
    public boolean isLoggedIn() {
        return m_hubEndpoint.isLoggedIn();
    }

    @Override
    public String getDisclaimer() {
        return m_hubEndpoint.getDisclaimer();
    }

    @Override
    public String sendRequest(final String endpointPath, final Object request) throws IOException {
        return m_hubEndpoint.sendRequest(endpointPath, request);
    }
}
