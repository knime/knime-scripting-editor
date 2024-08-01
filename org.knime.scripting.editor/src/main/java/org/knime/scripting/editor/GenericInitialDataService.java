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
 *   Nov 16, 2023 (benjamin): created
 */
package org.knime.scripting.editor;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.function.Supplier;

import org.knime.core.node.InvalidSettingsException;
import org.knime.core.node.NodeSettingsWO;
import org.knime.core.node.port.PortObjectSpec;
import org.knime.core.node.workflow.NodeContext;
import org.knime.core.webui.node.dialog.NodeAndVariableSettingsRO;
import org.knime.core.webui.node.dialog.NodeAndVariableSettingsWO;
import org.knime.core.webui.node.dialog.NodeSettingsService;
import org.knime.core.webui.node.dialog.SettingsType;
import org.knime.scripting.editor.ai.HubConnection;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.MapType;
import com.fasterxml.jackson.databind.type.TypeFactory;

/**
 * A {@link NodeSettingsService} implementation for scripting editor dialogs.
 * <ul>
 * <li>Provides the setting "script" to the dialog</li>
 * <li>Provides the name of the variable used for the "script" setting to the dialog (if configured)</li>
 * <li>Saves the setting "script" to the {@link NodeSettingsWO} on apply</li>
 * </ul>
 *
 * To be used together with {@link ScriptingNodeSettings}.
 *
 * @author Benjamin Wilhelm, KNIME GmbH, Berlin, Germany
 */
@SuppressWarnings("restriction") // NodeSettingsService is no yet public API
public class GenericInitialDataService implements NodeSettingsService {

    private Map<String, DataSupplier> m_dataSuppliers = new HashMap<>();

    private DataConsumer m_dataConsumer;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /**
     * Add a new {@link DataSupplier} to this service.
     *
     * @param key the key under which the data will be sent to the frontend
     * @param supplier the supplier that provides the data
     * @return this, for builder-style chaining
     */
    public GenericInitialDataService addDataSupplier(final String key, final DataSupplier supplier) {
        if (m_dataSuppliers.containsKey(key)) {
            throw new IllegalArgumentException("Data supplier with key '%s' already exists.".formatted(key));
        }

        m_dataSuppliers.put(key, supplier);
        return this;
    }

    public GenericInitialDataService setDataConsumer(final DataConsumer consumer) {
        if (m_dataConsumer != null) {
            throw new IllegalArgumentException("Data consumer already set.");
        }

        m_dataConsumer = consumer;
        return this;
    }

    @Override
    public final String fromNodeSettings(final Map<SettingsType, NodeAndVariableSettingsRO> settings,
        final PortObjectSpec[] specs) {

        var rootNode = OBJECT_MAPPER.createObjectNode();

        try {
            for (var entry : m_dataSuppliers.entrySet()) {
                rootNode.set(entry.getKey(), mapToJson(entry.getValue().getData(settings, specs)));
            }
        } catch (DataSupplierException e) {
            throw new IllegalStateException(e);
        }

        return rootNode.toString();
    }

    @Override
    public final void toNodeSettings(final String textSettings,
        final Map<SettingsType, NodeAndVariableSettingsRO> previousSettings,
        final Map<SettingsType, NodeAndVariableSettingsWO> settings) {

        for (int i = 0; i < 1000; ++i) {
            System.out.println("Received settings: " + textSettings);
        }

        try {
            var settingsFromJson = OBJECT_MAPPER.readTree(textSettings);
            m_dataConsumer.setData(settings, previousSettings, settingsFromJson);
        } catch (DataSupplierException | JsonProcessingException ex) {
            throw new IllegalStateException("Failed to set data", ex);
        }
    }

    private static final MapType JACKSON_HASHMAP_TYPE =
        TypeFactory.defaultInstance().constructMapType(HashMap.class, String.class, Object.class);

    private static JsonNode mapToJson(final Object data) {
        return OBJECT_MAPPER.valueToTree(data);
    }

    private static Map<String, Object> jsonToMap(final JsonNode json) {
        return OBJECT_MAPPER.convertValue(json, JACKSON_HASHMAP_TYPE);
    }

    /**
     * Create a default initial data service for a scripting editor. Includes: settings, input port configs,
     * isCodeAssistantEnabled, isCodeAssistantInstalled, hubId, isLoggedIntoHub
     *
     * @param loaderSupplier supplies a GenericSettingsLoader for converting node settings to a map
     * @param context the node context, used for getting the port configs
     * @return a new initial data service, which can be extended to include additional data suppliers
     */
    public static GenericInitialDataService createDefaultInitialDataService(
        final Supplier<GenericSettingsLoader> loaderSupplier, final Supplier<GenericSettingsSaver> saverSupplier,
        final NodeContext context) {

        return new GenericInitialDataService() //
            .addDataSupplier("settings", createSettingsSupplier(loaderSupplier)) //
            .addDataSupplier("inputPortConfigs", createInputPortConfigsSupplier(context)) //
            .addDataSupplier("inputsAvailable", createInputsAvailableSupplier(context)) //
            .addDataSupplier("kAiConfig", createKAIConfigSupplier()) //
            .setDataConsumer(createSettingsSaver(saverSupplier));
    }

    /*
     * ------------------------------------------------------------------------
     * Some general data suppliers that will be used by most/all editors
     * ------------------------------------------------------------------------
     */
    public static DataSupplier createSettingsSupplier(final Supplier<GenericSettingsLoader> loaderSupplier) {
        return (settings, specs) -> {
            try {
                var loader = loaderSupplier.get();

                return loader.convertNodeSettingsToMap(settings);
            } catch (InvalidSettingsException ex) {
                throw new DataSupplierException("Failed to load settings", ex);
            }
        };
    }

    public static DataConsumer createSettingsSaver(final Supplier<GenericSettingsSaver> saverSupplier) {
        return (settingsToWrite, previousSettings, textSettings) -> {
            System.out.println("Saving settings: " + textSettings);
            try {
                var saver = saverSupplier.get();
                var settings = jsonToMap(textSettings);
                saver.writeMapToNodeSettings(settings, settingsToWrite);
            } catch (InvalidSettingsException ex) {
                throw new DataSupplierException("Failed to save settings", ex);
            }
        };
    }

    public static DataSupplier createInputsAvailableSupplier(final NodeContext context) {
        return (settings, specs) -> {
            return Arrays.stream(new WorkflowControl(context.getNodeContainer()).getInputData())
                .allMatch(Objects::nonNull);
        };
    }

    public static DataSupplier createInputPortConfigsSupplier(final NodeContext context) {
        return (settings, specs) -> {
            return new PortConfigs(context.getNodeContainer());
        };
    }

    private static final String AI_ASSISTANT_FEATURE_FLAG = "org.knime.ui.feature.ai_assistant";

    private static final boolean AI_ASSISTANT_FEATURE_ENABLED =
        System.getProperty(AI_ASSISTANT_FEATURE_FLAG) == null || Boolean.getBoolean(AI_ASSISTANT_FEATURE_FLAG);

    public static DataSupplier createKAIConfigSupplier() {
        return (settings, specs) -> {
            Map<String, Object> result = new HashMap<>();

            result.put("codeAssistantEnabled", AI_ASSISTANT_FEATURE_ENABLED);
            result.put("codeAssistantInstalled", AI_ASSISTANT_FEATURE_ENABLED && HubConnection.INSTANCE.isAvailable());
            result.put("hubId", HubConnection.INSTANCE.isAvailable() ? HubConnection.INSTANCE.getHubId() : null);
            result.put("loggedIntoHub", HubConnection.INSTANCE.isAvailable() && HubConnection.INSTANCE.isLoggedIn());

            return result;
        };
    }

    public static DataSupplier createGetFlowVariablesSupplier(final InputOutputModel flowVariables) {
        return (settings, specs) -> {
            return flowVariables;
        };
    }

    // TODO: still need getInputObjects and getOutputObjects. Also I don't think that this flow variables thing is necessary here,
    // since it depends on about one million editor-specific things anyway. Let's move it to the specific editors?

    // TODO: then need to implement the suppliers for specific editors, e.g. getFunctionCatalog, hasPreview, getRowCount...
    // But let's not do that here. We can do that in the specific editor repositories.

    // TODO: and then figure out how we can make this all work nicely. I'd maybe suggest we create a 'basic' initial data
    // service, which is used by all editors and includes all of the suppliers defined here, and then the specific editors
    // can add additional suppliers as needed.

    /**
     * Used by the {@link GenericInitialDataService} to supply data to the editor in a composable way.
     *
     * @author David Hickey, TNG Technology Consulting GmbH
     */
    public static interface DataSupplier {

        /**
         * Return the data for which this supplier is responsible. The settings and specs are provided, but the supplier
         * may ignore them.
         *
         * @param settings the settings for the node, which may be from the file or overridden by flow variables.
         * @param specs the specs for the ports connected to the node, including the flow variables.
         * @return the data whatever data the supplier is responsible for, which will be serialised to JSON and then
         *         sent to the editor along with the data from the other suppliers.
         * @throws DataSupplierException if something went wrong while getting the data.
         */
        Object getData(final Map<SettingsType, NodeAndVariableSettingsRO> settings, final PortObjectSpec[] specs)
            throws DataSupplierException;

        /**
         * A {@link DataSupplier} that always returns an empty map.
         */
        DataSupplier EMPTY = (settings, specs) -> Map.of();
    }

    public static interface DataConsumer {

        void setData(Map<SettingsType, NodeAndVariableSettingsWO> settingsToWrite,
            Map<SettingsType, NodeAndVariableSettingsRO> previousSettings, JsonNode textSettings)
            throws DataSupplierException;

        DataConsumer EMPTY = (settingsToWrite, previousSettings, textSettings) -> {
        };
    }

    /**
     * Exception thrown by the {@link DataSupplier} if something goes wrong while getting the data.
     *
     * @author David Hickey, TNG Technology Consulting GmbH
     */
    public static class DataSupplierException extends Exception {

        private static final long serialVersionUID = 1L;

        public DataSupplierException(final String message) {
            super(message);
        }

        public DataSupplierException(final String message, final Throwable cause) {
            super(message, cause);
        }
    }

}
